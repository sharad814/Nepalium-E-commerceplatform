import { Link } from "@tanstack/react-router";
import { Star, MapPin, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatPrice, salePrice } from "@/lib/branding";
import { useCart } from "@/hooks/useCart";
import type { Product } from "@/lib/catalog";

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const price = Number(product.price);
  const final = salePrice(price, product.discount_percent);
  const outOfStock = product.stock <= 0;
  const lowStock = !outOfStock && product.stock <= 10;

  return (
    <article className="group card-lift relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
      <Link
        to="/product/$slug"
        params={{ slug: product.slug }}
        className="relative block aspect-square overflow-hidden bg-muted"
      >
        <img
          src={product.images[0] ?? "/placeholder.svg"}
          alt={product.title}
          loading="lazy"
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {product.discount_percent > 0 && (
            <Badge className="bg-gradient-gold text-accent-foreground shadow-soft">
              -{product.discount_percent}%
            </Badge>
          )}
          {outOfStock && <Badge variant="destructive">Out of stock</Badge>}
          {lowStock && (
            <Badge variant="secondary">Only {product.stock} left</Badge>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        {product.stores?.district && (
          <p className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3" />
            {product.stores.district}, {product.stores.province}
          </p>
        )}
        <h3 className="line-clamp-2 font-sans text-sm font-semibold leading-snug">
          <Link to="/product/$slug" params={{ slug: product.slug }}>
            {product.title}
          </Link>
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">{product.stores?.name}</p>

        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
          <Star className="size-3.5 fill-accent text-accent" />
          <span className="font-medium text-foreground">{Number(product.rating).toFixed(1)}</span>
          <span>({product.review_count})</span>
        </div>

        <div className="mt-3 flex items-end justify-between gap-2">
          <div>
            <p className="font-display text-lg font-semibold">{formatPrice(final)}</p>
            {product.discount_percent > 0 && (
              <p className="text-xs text-muted-foreground line-through">{formatPrice(price)}</p>
            )}
          </div>
          <Button
            size="icon"
            className="rounded-full"
            disabled={outOfStock}
            aria-label={`Add ${product.title} to cart`}
            onClick={() => void addItem(product.id)}
          >
            <ShoppingCart className="size-4" />
          </Button>
        </div>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="h-full animate-pulse overflow-hidden rounded-2xl border border-border bg-card">
      <div className="aspect-square bg-muted" />
      <div className="space-y-2 p-4">
        <div className="h-3 w-1/2 rounded bg-muted" />
        <div className="h-4 w-full rounded bg-muted" />
        <div className="h-4 w-2/3 rounded bg-muted" />
      </div>
    </div>
  );
}
