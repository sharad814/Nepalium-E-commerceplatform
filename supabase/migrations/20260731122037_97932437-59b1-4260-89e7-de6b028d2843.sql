-- ENUMS
CREATE TYPE public.app_role AS ENUM ('admin','seller','customer');
CREATE TYPE public.application_status AS ENUM ('pending','approved','rejected');
CREATE TYPE public.product_status AS ENUM ('pending','approved','rejected');

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  full_name text,
  phone text,
  avatar_url text,
  province text,
  district text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ROLES
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Own profile readable" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "Update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "Read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- new user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name',''))
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- CATEGORIES
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  icon text,
  sort_order int NOT NULL DEFAULT 0
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories are public" ON public.categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins manage categories" ON public.categories FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- STORES
CREATE TABLE public.stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  logo_url text,
  province text,
  district text,
  municipality text,
  rating numeric(2,1) NOT NULL DEFAULT 4.5,
  is_suspended boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.stores TO anon;
GRANT SELECT, INSERT, UPDATE ON public.stores TO authenticated;
GRANT ALL ON public.stores TO service_role;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Active stores are public" ON public.stores FOR SELECT TO anon, authenticated USING (is_suspended = false OR owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Sellers create own store" ON public.stores FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid() AND public.has_role(auth.uid(),'seller'));
CREATE POLICY "Sellers update own store" ON public.stores FOR UPDATE TO authenticated USING (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- SELLER APPLICATIONS
CREATE TABLE public.seller_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  store_name text NOT NULL,
  description text,
  province text,
  district text,
  municipality text,
  phone text,
  document_url text,
  status public.application_status NOT NULL DEFAULT 'pending',
  rejection_reason text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.seller_applications TO authenticated;
GRANT ALL ON public.seller_applications TO service_role;
ALTER TABLE public.seller_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own or admin applications" ON public.seller_applications FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Apply for self" ON public.seller_applications FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND status = 'pending');
CREATE POLICY "Admins review applications" ON public.seller_applications FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- PRODUCTS
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  price numeric(12,2) NOT NULL,
  discount_percent int NOT NULL DEFAULT 0,
  stock int NOT NULL DEFAULT 0,
  images text[] NOT NULL DEFAULT '{}',
  province text,
  district text,
  status public.product_status NOT NULL DEFAULT 'pending',
  rejection_reason text,
  rating numeric(2,1) NOT NULL DEFAULT 0,
  review_count int NOT NULL DEFAULT 0,
  is_featured boolean NOT NULL DEFAULT false,
  deal_group smallint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Approved products are public" ON public.products FOR SELECT TO anon, authenticated
  USING (status = 'approved' OR public.has_role(auth.uid(),'admin') OR store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid()));
CREATE POLICY "Sellers add own pending products" ON public.products FOR INSERT TO authenticated
  WITH CHECK (status = 'pending' AND store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid()));
CREATE POLICY "Sellers or admins update products" ON public.products FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid()))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid()));
CREATE POLICY "Sellers or admins delete products" ON public.products FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR store_id IN (SELECT id FROM public.stores WHERE owner_id = auth.uid()));
CREATE INDEX products_status_idx ON public.products(status);
CREATE INDEX products_category_idx ON public.products(category_id);

-- CART
CREATE TABLE public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cart_items TO authenticated;
GRANT ALL ON public.cart_items TO service_role;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own cart" ON public.cart_items FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- SEED
INSERT INTO public.categories (name, slug, icon, sort_order) VALUES
 ('Vegetables','vegetables','Carrot',1),
 ('Fruits','fruits','Apple',2),
 ('Organic & Honey','organic-honey','Leaf',3),
 ('Tea & Coffee','tea-coffee','Coffee',4),
 ('Herbs & Spices','herbs-spices','Flame',5),
 ('Handicrafts','handicrafts','Palette',6),
 ('Clothing','clothing','Shirt',7),
 ('Electronics','electronics','Cpu',8),
 ('Furniture','furniture','Armchair',9),
 ('Books','books','BookOpen',10),
 ('Seeds & Tools','seeds-tools','Sprout',11),
 ('Agriculture Equipment','agri-equipment','Tractor',12);

INSERT INTO public.stores (id, name, slug, description, province, district, municipality, rating) VALUES
 ('11111111-1111-1111-1111-111111111111','Himalayan Harvest','himalayan-harvest','Organic produce from the hills of Ilam.','Koshi','Ilam','Ilam Municipality',4.8),
 ('22222222-2222-2222-2222-222222222222','Kathmandu Craft House','kathmandu-craft-house','Handmade Nepali crafts and textiles.','Bagmati','Kathmandu','Kathmandu Metropolitan',4.6),
 ('33333333-3333-3333-3333-333333333333','Pokhara Agro Mart','pokhara-agro-mart','Seeds, tools and farm equipment.','Gandaki','Kaski','Pokhara Metropolitan',4.4),
 ('44444444-4444-4444-4444-444444444444','Terai Fresh Foods','terai-fresh-foods','Fresh vegetables and fruits from the Terai belt.','Madhesh','Dhanusha','Janakpur Sub-Metropolitan',4.5);

INSERT INTO public.products (store_id, category_id, title, slug, description, price, discount_percent, stock, images, province, district, status, rating, review_count, is_featured, deal_group)
SELECT s.id, c.id, v.title, v.slug, v.description, v.price, v.discount, v.stock, ARRAY[v.image], s.province, s.district, 'approved', v.rating, v.reviews, v.featured, v.dg
FROM (VALUES
 ('himalayan-harvest','tea-coffee','Ilam Orthodox Black Tea 250g','ilam-orthodox-black-tea','Hand-picked orthodox black tea from Ilam''s terraced gardens.',780,15,120,'https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=800',4.8,214,true,0),
 ('himalayan-harvest','organic-honey','Wild Cliff Honey 500g','wild-cliff-honey','Raw wild honey harvested from Himalayan cliffs.',1450,10,60,'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800',4.9,132,true,1),
 ('himalayan-harvest','herbs-spices','Timur Szechuan Pepper 100g','timur-pepper','Aromatic Nepali timur with a citrusy tingle.',420,0,200,'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800',4.6,88,false,2),
 ('himalayan-harvest','tea-coffee','Highland Arabica Coffee 500g','highland-arabica-coffee','Medium roast arabica grown at 1,400m.',1180,20,45,'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800',4.7,96,true,3),
 ('kathmandu-craft-house','handicrafts','Handwoven Dhaka Shawl','handwoven-dhaka-shawl','Traditional Dhaka weave in natural dyes.',2650,25,30,'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?w=800',4.8,74,true,4),
 ('kathmandu-craft-house','handicrafts','Singing Bowl 5 inch','singing-bowl-5-inch','Hand-hammered seven metal singing bowl.',3400,10,25,'https://images.unsplash.com/photo-1591291621164-2c6367723315?w=800',4.9,151,true,5),
 ('kathmandu-craft-house','clothing','Pashmina Scarf Natural','pashmina-scarf-natural','100% Himalayan pashmina, feather light.',4200,15,40,'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=800',4.7,63,false,6),
 ('kathmandu-craft-house','books','Nepali Folk Tales Hardcover','nepali-folk-tales','Illustrated collection of Nepali folk stories.',890,0,80,'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800',4.5,41,false,0),
 ('pokhara-agro-mart','seeds-tools','Organic Vegetable Seed Kit','organic-seed-kit','Twelve varieties of open-pollinated seeds.',650,20,150,'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800',4.4,57,false,1),
 ('pokhara-agro-mart','agri-equipment','Knapsack Sprayer 16L','knapsack-sprayer-16l','Durable manual sprayer for small farms.',3250,10,35,'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800',4.3,29,false,2),
 ('pokhara-agro-mart','furniture','Bamboo Storage Rack','bamboo-storage-rack','Handmade bamboo rack, four tiers.',5400,15,12,'https://images.unsplash.com/photo-1503602642458-232111445657?w=800',4.2,18,false,3),
 ('pokhara-agro-mart','electronics','Solar Home Light Kit','solar-home-light-kit','Two LED lamps with a 20W solar panel.',7800,25,20,'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800',4.6,64,true,4),
 ('terai-fresh-foods','vegetables','Fresh Tomatoes 1kg','fresh-tomatoes-1kg','Vine ripened tomatoes, farm packed.',95,10,300,'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=800',4.3,110,false,5),
 ('terai-fresh-foods','vegetables','Organic Spinach Bundle','organic-spinach-bundle','Pesticide free spinach harvested daily.',60,0,240,'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=800',4.4,73,false,6),
 ('terai-fresh-foods','fruits','Nepali Junar Orange 2kg','nepali-junar-orange','Sweet Sindhuli junar, hand graded.',480,15,90,'https://images.unsplash.com/photo-1547514701-42782101795e?w=800',4.7,142,true,0),
 ('terai-fresh-foods','fruits','Himalayan Apple 2kg','himalayan-apple-2kg','Crisp Jumla apples, cold stored.',560,20,70,'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=800',4.6,98,true,1)
) AS v(store_slug, cat_slug, title, slug, description, price, discount, stock, image, rating, reviews, featured, dg)
JOIN public.stores s ON s.slug = v.store_slug
JOIN public.categories c ON c.slug = v.cat_slug;