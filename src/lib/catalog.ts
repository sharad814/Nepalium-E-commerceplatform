import { supabase } from "@/integrations/supabase/client";

export type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  sort_order: number;
};

export type StoreSummary = {
  id: string;
  name: string;
  slug: string;
  province: string | null;
  district: string | null;
  rating: number;
};

export type Product = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  price: number;
  discount_percent: number;
  stock: number;
  images: string[];
  province: string | null;
  district: string | null;
  rating: number;
  review_count: number;
  is_featured: boolean;
  created_at: string;
  category_id: string | null;
  store_id: string;
  stores?: StoreSummary | null;
  categories?: { name: string; slug: string } | null;
};

const PRODUCT_SELECT =
  "id,title,slug,description,price,discount_percent,stock,images,province,district,rating,review_count,is_featured,created_at,category_id,store_id,stores(id,name,slug,province,district,rating),categories(name,slug)";

/** Rotating deal group — changes every day so today's deals differ from yesterday's. */
export function todaysDealGroup(): number {
  const start = Date.UTC(new Date().getUTCFullYear(), 0, 0);
  const dayOfYear = Math.floor((Date.now() - start) / 86_400_000);
  return dayOfYear % 7;
}

export async function fetchCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("id,name,slug,icon,sort_order")
    .order("sort_order");
  if (error) throw error;
  return (data ?? []) as Category[];
}

export type ProductFilters = {
  search?: string | undefined;
  category?: string | undefined;
  province?: string | undefined;
  district?: string | undefined;
  minPrice?: number | undefined;
  maxPrice?: number | undefined;
  minRating?: number | undefined;
  inStockOnly?: boolean | undefined;
  sort?: "newest" | "price-asc" | "price-desc" | "rating" | "discount" | undefined;
  featuredOnly?: boolean | undefined;
  dealsOnly?: boolean | undefined;
  storeSlug?: string | undefined;
  limit?: number | undefined;
  offset?: number | undefined;
};

export async function fetchProducts(
  filters: ProductFilters = {},
): Promise<{ items: Product[]; total: number }> {
  let query = supabase
    .from("products")
    .select(PRODUCT_SELECT, { count: "exact" })
    .eq("status", "approved");

  if (filters.search) query = query.ilike("title", `%${filters.search}%`);
  if (filters.province) query = query.eq("province", filters.province);
  if (filters.district) query = query.eq("district", filters.district);
  if (filters.minPrice != null) query = query.gte("price", filters.minPrice);
  if (filters.maxPrice != null) query = query.lte("price", filters.maxPrice);
  if (filters.minRating != null) query = query.gte("rating", filters.minRating);
  if (filters.inStockOnly) query = query.gt("stock", 0);
  if (filters.featuredOnly) query = query.eq("is_featured", true);
  if (filters.dealsOnly) query = query.eq("deal_group", todaysDealGroup()).gt("discount_percent", 0);

  if (filters.category) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", filters.category)
      .maybeSingle();
    if (!cat) return { items: [], total: 0 };
    query = query.eq("category_id", cat.id);
  }

  if (filters.storeSlug) {
    const { data: store } = await supabase
      .from("stores")
      .select("id")
      .eq("slug", filters.storeSlug)
      .maybeSingle();
    if (!store) return { items: [], total: 0 };
    query = query.eq("store_id", store.id);
  }

  switch (filters.sort) {
    case "price-asc":
      query = query.order("price", { ascending: true });
      break;
    case "price-desc":
      query = query.order("price", { ascending: false });
      break;
    case "rating":
      query = query.order("rating", { ascending: false });
      break;
    case "discount":
      query = query.order("discount_percent", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const limit = filters.limit ?? 24;
  const offset = filters.offset ?? 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) throw error;
  return { items: (data ?? []) as unknown as Product[], total: count ?? 0 };
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as Product) ?? null;
}

export async function fetchTopStores(): Promise<StoreSummary[]> {
  const { data, error } = await supabase
    .from("stores")
    .select("id,name,slug,province,district,rating")
    .eq("is_suspended", false)
    .order("rating", { ascending: false })
    .limit(8);
  if (error) throw error;
  return (data ?? []) as StoreSummary[];
}
