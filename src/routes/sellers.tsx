import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BadgeCheck, MapPin, Star } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { fetchTopStores } from "@/lib/catalog";

export const Route = createFileRoute("/sellers")({
  head: () => ({
    meta: [
      { title: "Verified sellers — Nepalium marketplace" },
      {
        name: "description",
        content:
          "Meet the verified farms, artisans and shops selling on Nepalium across all seven provinces of Nepal.",
      },
      { property: "og:title", content: "Verified sellers — Nepalium marketplace" },
      {
        property: "og:description",
        content: "Meet the verified Nepali sellers behind the marketplace.",
      },
    ],
  }),
  component: SellersPage,
});

function SellersPage() {
  const { data, isLoading } = useQuery({ queryKey: ["top-stores"], queryFn: fetchTopStores });

  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6">
        <header className="max-w-2xl">
          <h1 className="font-display text-3xl font-semibold sm:text-4xl">Verified sellers</h1>
          <p className="mt-3 text-muted-foreground">
            Every store below passed Nepalium's verification review — identity, location and
            product quality.
          </p>
        </header>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-2xl" />)
            : (data ?? []).map((s) => (
                <article
                  key={s.id}
                  className="rounded-2xl border border-border bg-card p-6 shadow-soft transition-all hover:-translate-y-1 hover:shadow-elevated"
                >
                  <div className="flex items-center gap-4">
                    <span className="grid size-14 place-items-center rounded-xl bg-gradient-brand font-display text-xl font-semibold text-primary-foreground">
                      {s.name.charAt(0)}
                    </span>
                    <div className="min-w-0">
                      <h2 className="flex items-center gap-1 truncate font-display text-lg font-semibold">
                        {s.name} <BadgeCheck className="size-4 shrink-0 text-primary" />
                      </h2>
                      <p className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="size-3" /> {s.district ?? "Nepal"}
                        {s.province ? `, ${s.province}` : ""}
                      </p>
                    </div>
                  </div>
                  <p className="mt-4 flex items-center gap-1 text-sm text-muted-foreground">
                    <Star className="size-4 fill-accent text-accent" />
                    <span className="font-medium text-foreground">
                      {Number(s.rating).toFixed(1)}
                    </span>{" "}
                    seller rating
                  </p>
                  <Button asChild variant="outline" size="sm" className="mt-5 rounded-full">
                    <Link to="/store/$slug" params={{ slug: s.slug }}>
                      Visit store
                    </Link>
                  </Button>
                </article>
              ))}
        </div>
      </div>
    </SiteLayout>
  );
}
