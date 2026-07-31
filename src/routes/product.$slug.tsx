import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  Star,
  MapPin,
  Truck,
  ShieldCheck,
  Store,
  Minus,
  Plus,
  Heart,
  Share2,
  PackageCheck,
} from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductCard } from "@/components/site/ProductCard";
import { fetchProductBySlug, fetchProducts } from "@/lib/catalog";
import { formatPrice, salePrice } from "@/lib/branding";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";

export const Route = createFileRoute("/product/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug.replace(/-/g, " ")} — Nepalium` },
      {
        name: "description",
        content:
          "View product details, seller information, stock and reviews on Nepalium, Nepal's multi-vendor marketplace.",
      },
      { property: "og:title", content: `${params.slug.replace(/-/g, " ")} — Nepalium` },
      {
        property: "og:description",
        content: "Buy directly from verified Nepali sellers on Nepalium.",
      },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  const { data: product, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => fetchProductBySlug(slug),
  });

  const related = useQuery({
    queryKey: ["related", product?.category_id],
    enabled: Boolean(product?.category_id),
    queryFn: () => fetchProducts({ limit: 5, sort: "rating" }),
  });

  useEffect(() => {
    setQuantity(1);
    setActiveImage(0);
  }, [slug]);

  if (isLoading) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-7xl animate-pulse px-4 py-16 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-2">
            <div className="aspect-square rounded-3xl bg-muted" />
            <div className="space-y-4">
              <div className="h-8 w-3/4 rounded bg-muted" />
              <div className="h-4 w-1/2 rounded bg-muted" />
              <div className="h-24 rounded bg-muted" />
            </div>
          </div>
        </div>
      </SiteLayout>
    );
  }

  if (!product) throw notFound();

  const price = Number(product.price);
  const final = salePrice(price, product.discount_percent);
  const outOfStock = product.stock <= 0;
  const images = product.images.length ? product.images : ["/placeholder.svg"];

  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        <nav className="mb-6 text-sm text-muted-foreground" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-foreground">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link to="/shop" className="hover:text-foreground">
            Shop
          </Link>
          {product.categories && (
            <>
              <span className="mx-2">/</span>
              <Link
                to="/shop"
                search={{ category: product.categories.slug } as never}
                className="hover:text-foreground"
              >
                {product.categories.name}
              </Link>
            </>
          )}
        </nav>

        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
              <img
                src={images[activeImage]}
                alt={product.title}
                className="aspect-square w-full object-cover transition-transform duration-500 hover:scale-110"
              />
            </div>
            {images.length > 1 && (
              <div className="mt-4 flex gap-3">
                {images.map((img, i) => (
                  <button
                    key={img}
                    onClick={() => setActiveImage(i)}
                    aria-label={`View image ${i + 1}`}
                    className={`size-20 overflow-hidden rounded-xl border-2 ${
                      i === activeImage ? "border-primary" : "border-border"
                    }`}
                  >
                    <img src={img} alt="" className="size-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              {product.discount_percent > 0 && (
                <Badge className="bg-gradient-gold text-accent-foreground">
                  -{product.discount_percent}% today
                </Badge>
              )}
              {product.is_featured && <Badge variant="secondary">Featured</Badge>}
              {outOfStock ? (
                <Badge variant="destructive">Out of stock</Badge>
              ) : (
                <Badge variant="secondary" className="text-success">
                  {product.stock} in stock
                </Badge>
              )}
            </div>

            <h1 className="mt-4 font-display text-3xl font-semibold sm:text-4xl">
              {product.title}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Star className="size-4 fill-accent text-accent" />
                <span className="font-medium text-foreground">
                  {Number(product.rating).toFixed(1)}
                </span>
                ({product.review_count} reviews)
              </span>
              {product.district && (
                <span className="flex items-center gap-1">
                  <MapPin className="size-4" /> {product.district}, {product.province}
                </span>
              )}
            </div>

            <div className="mt-6 flex items-end gap-3">
              <p className="font-display text-4xl font-semibold">{formatPrice(final)}</p>
              {product.discount_percent > 0 && (
                <p className="pb-1 text-lg text-muted-foreground line-through">
                  {formatPrice(price)}
                </p>
              )}
            </div>

            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
              {product.description}
            </p>

            <Separator className="my-6" />

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center rounded-full border border-border">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  aria-label="Decrease quantity"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  <Minus className="size-4" />
                </Button>
                <span className="w-10 text-center text-sm font-medium">{quantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  aria-label="Increase quantity"
                  onClick={() => setQuantity((q) => Math.min(product.stock || 1, q + 1))}
                >
                  <Plus className="size-4" />
                </Button>
              </div>

              <Button
                size="lg"
                className="flex-1 rounded-full"
                disabled={outOfStock}
                onClick={() => void addItem(product.id, quantity)}
              >
                Add to cart
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="rounded-full"
                aria-label="Save to wishlist"
                onClick={() => toast.success("Saved to your wishlist")}
              >
                <Heart className="size-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="rounded-full"
                aria-label="Share product"
                onClick={() => {
                  void navigator.clipboard.writeText(window.location.href);
                  toast.success("Product link copied");
                }}
              >
                <Share2 className="size-4" />
              </Button>
            </div>

            {product.stores && (
              <div className="mt-8 rounded-2xl border border-border bg-card p-5 shadow-soft">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="grid size-11 place-items-center rounded-xl bg-gradient-brand text-primary-foreground">
                      <Store className="size-5" />
                    </span>
                    <div>
                      <p className="font-semibold">{product.stores.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {product.stores.district}, {product.stores.province} ·{" "}
                        {Number(product.stores.rating).toFixed(1)}★ seller
                      </p>
                    </div>
                  </div>
                  <Button asChild variant="outline" size="sm" className="rounded-full">
                    <Link to="/store/$slug" params={{ slug: product.stores.slug }}>
                      Visit store
                    </Link>
                  </Button>
                </div>
              </div>
            )}

            <ul className="mt-6 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
              <li className="flex items-center gap-2">
                <Truck className="size-4 text-primary" /> 2–5 day delivery
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-primary" /> Verified seller
              </li>
              <li className="flex items-center gap-2">
                <PackageCheck className="size-4 text-primary" /> 7-day returns
              </li>
            </ul>
          </div>
        </div>

        <Tabs defaultValue="description" className="mt-14">
          <TabsList>
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="shipping">Shipping</TabsTrigger>
            <TabsTrigger value="reviews">Reviews ({product.review_count})</TabsTrigger>
          </TabsList>
          <TabsContent value="description" className="max-w-3xl pt-6 text-sm leading-relaxed text-muted-foreground">
            {product.description}
          </TabsContent>
          <TabsContent value="shipping" className="max-w-3xl pt-6 text-sm leading-relaxed text-muted-foreground">
            Ships from {product.district ?? "Nepal"}. Inside the Kathmandu valley orders usually
            arrive in 1–2 days; other districts take 2–5 days. Cash on delivery, eSewa, Khalti and
            card payments are supported at checkout.
          </TabsContent>
          <TabsContent value="reviews" className="max-w-3xl pt-6">
            <p className="text-sm text-muted-foreground">
              This product has an average rating of {Number(product.rating).toFixed(1)} from{" "}
              {product.review_count} verified purchases. Written reviews arrive with the orders
              milestone.
            </p>
          </TabsContent>
        </Tabs>

        {related.data?.items?.length ? (
          <section className="mt-16">
            <h2 className="font-display text-2xl font-semibold">You may also like</h2>
            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {related.data.items
                .filter((p) => p.id !== product.id)
                .slice(0, 5)
                .map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
            </div>
          </section>
        ) : null}
      </div>
    </SiteLayout>
  );
}
