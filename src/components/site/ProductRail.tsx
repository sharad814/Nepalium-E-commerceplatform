import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard, ProductCardSkeleton } from "@/components/site/ProductCard";
import type { Product } from "@/lib/catalog";

type Props = {
  title: string;
  subtitle?: string;
  products: Product[];
  loading?: boolean;
  viewAllTo?: string;
  viewAllSearch?: Record<string, string>;
};

/** Horizontally scrollable product rail used across the home page. */
export function ProductRail({
  title,
  subtitle,
  products,
  loading,
  viewAllTo = "/shop",
  viewAllSearch,
}: Props) {
  if (!loading && products.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        <Button asChild variant="ghost" className="shrink-0 gap-1">
          <Link to={viewAllTo} search={viewAllSearch as never}>
            View all <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => <ProductCardSkeleton key={i} />)
          : products.slice(0, 10).map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  );
}
