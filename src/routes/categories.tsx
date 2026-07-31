import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { fetchCategories } from "@/lib/catalog";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "All categories — Nepalium marketplace" },
      {
        name: "description",
        content:
          "Explore every Nepalium category: fresh produce, handicrafts, Himalayan tea, spices, apparel, tools and more.",
      },
      { property: "og:title", content: "All categories — Nepalium marketplace" },
      {
        property: "og:description",
        content: "Explore every product category on Nepal's multi-vendor marketplace.",
      },
    ],
  }),
  component: CategoriesPage,
});

function CategoriesPage() {
  const { data, isLoading } = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });

  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6">
        <header className="max-w-2xl">
          <h1 className="font-display text-3xl font-semibold sm:text-4xl">Shop by category</h1>
          <p className="mt-3 text-muted-foreground">
            Every category is stocked by verified sellers across Nepal's seven provinces.
          </p>
        </header>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading
            ? Array.from({ length: 9 }).map((_, i) => (
                <Skeleton key={i} className="h-32 rounded-2xl" />
              ))
            : (data ?? []).map((c) => (
                <Link
                  key={c.id}
                  to="/shop"
                  search={{ category: c.slug } as never}
                  className="group flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-6 shadow-soft transition-all hover:-translate-y-1 hover:shadow-elevated"
                >
                  <div className="flex items-center gap-4">
                    <span className="grid size-14 place-items-center rounded-xl bg-secondary text-2xl">
                      {c.icon ?? "🛍️"}
                    </span>
                    <div>
                      <p className="font-display text-lg font-semibold">{c.name}</p>
                      <p className="text-xs text-muted-foreground">Browse products</p>
                    </div>
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </Link>
              ))}
        </div>
      </div>
    </SiteLayout>
  );
}
