import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Star, BadgeCheck, Package } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ProductCard, ProductCardSkeleton } from "@/components/site/ProductCard";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { fetchProducts } from "@/lib/catalog";

async function fetchStore(slug: string) {
  const { data, error } = await supabase
    .from("stores")
    .select("id,name,slug,description,province,district,rating,logo_url,is_suspended")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export const Route = createFileRoute("/store/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug.replace(/-/g, " ")} — Seller store on Nepalium` },
      {
        name: "description",
        content:
          "Browse this verified Nepali seller's full product catalogue, location and customer rating on Nepalium.",
      },
      { property: "og:title", content: `${params.slug.replace(/-/g, " ")} — Nepalium seller` },
      {
        property: "og:description",
        content: "Browse this verified seller's catalogue on Nepalium.",
      },
    ],
  }),
  component: StorePage,
});

function StorePage() {
  const { slug } = Route.useParams();
  const store = useQuery({ queryKey: ["store", slug], queryFn: () => fetchStore(slug) });
  const products = useQuery({
    queryKey: ["store-products", slug],
    queryFn: () => fetchProducts({ storeSlug: slug, limit: 24 }),
  });

  if (store.isLoading) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-7xl animate-pulse px-4 py-12 sm:px-6">
          <div className="h-48 rounded-3xl bg-muted" />
        </div>
      </SiteLayout>
    );
  }
  if (!store.data) throw notFound();

  const s = store.data;

  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
        <section className="overflow-hidden rounded-3xl border border-border shadow-soft">
          <div className="h-40 bg-gradient-hero sm:h-52" />
          <div className="flex flex-wrap items-end gap-6 bg-card p-6 sm:p-8">
            <span className="-mt-16 grid size-24 place-items-center rounded-2xl border-4 border-card bg-gradient-brand font-display text-3xl font-semibold text-primary-foreground">
              {s.name.charAt(0)}
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="flex items-center gap-2 font-display text-2xl font-semibold sm:text-3xl">
                {s.name}
                <BadgeCheck className="size-5 text-primary" />
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="size-4" /> {s.district ?? "Nepal"}
                  {s.province ? `, ${s.province}` : ""}
                </span>
                <span className="flex items-center gap-1">
                  <Star className="size-4 fill-accent text-accent" />
                  {Number(s.rating).toFixed(1)} seller rating
                </span>
                <span className="flex items-center gap-1">
                  <Package className="size-4" /> {products.data?.total ?? 0} products
                </span>
              </div>
            </div>
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/sellers">All sellers</Link>
            </Button>
          </div>
        </section>

        {s.description && (
          <p className="mt-6 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            {s.description}
          </p>
        )}

        <h2 className="mt-12 font-display text-2xl font-semibold">Products from this store</h2>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.isLoading
            ? Array.from({ length: 8 }).map((_, i) => <ProductCardSkeleton key={i} />)
            : products.data!.items.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
        {!products.isLoading && products.data!.items.length === 0 && (
          <p className="mt-6 rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
            This seller hasn't published any approved products yet.
          </p>
        )}
      </div>
    </SiteLayout>
  );
}
