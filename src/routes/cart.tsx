import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, Trash2, ShoppingBag, ShieldCheck } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { formatPrice, salePrice } from "@/lib/branding";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your shopping cart — Nepalium" },
      {
        name: "description",
        content: "Review the items in your Nepalium cart and continue to checkout.",
      },
      { property: "og:title", content: "Your shopping cart — Nepalium" },
      { property: "og:description", content: "Review your Nepalium cart before checkout." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { user } = useAuth();
  const { lines, subtotal, setQuantity, removeItem, loading } = useCart();
  const shipping = subtotal > 5000 || subtotal === 0 ? 0 : 150;

  if (!user) {
    return (
      <SiteLayout>
        <EmptyState
          title="Sign in to see your cart"
          body="Your cart follows you across devices once you're signed in."
          action={
            <Button asChild className="rounded-full">
              <Link to="/auth">Sign in</Link>
            </Button>
          }
        />
      </SiteLayout>
    );
  }

  if (!loading && lines.length === 0) {
    return (
      <SiteLayout>
        <EmptyState
          title="Your cart is empty"
          body="Browse the marketplace and add something made in Nepal."
          action={
            <Button asChild className="rounded-full">
              <Link to="/shop">Start shopping</Link>
            </Button>
          }
        />
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-3xl font-semibold sm:text-4xl">Your cart</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {lines.length} item{lines.length === 1 ? "" : "s"} from Nepali sellers
        </p>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <ul className="space-y-4">
            {lines.map((line) => {
              const unit = salePrice(line.price, line.discount_percent);
              return (
                <li
                  key={line.id}
                  className="flex gap-4 rounded-2xl border border-border bg-card p-4 shadow-soft"
                >
                  <Link
                    to="/product/$slug"
                    params={{ slug: line.slug }}
                    className="size-24 shrink-0 overflow-hidden rounded-xl bg-muted"
                  >
                    <img
                      src={line.image ?? "/placeholder.svg"}
                      alt={line.title}
                      className="size-full object-cover"
                    />
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <Link
                      to="/product/$slug"
                      params={{ slug: line.slug }}
                      className="truncate font-medium hover:text-primary"
                    >
                      {line.title}
                    </Link>
                    {line.storeName && (
                      <p className="text-xs text-muted-foreground">Sold by {line.storeName}</p>
                    )}
                    <div className="mt-auto flex flex-wrap items-center gap-3 pt-3">
                      <div className="flex items-center rounded-full border border-border">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 rounded-full"
                          aria-label="Decrease quantity"
                          onClick={() => void setQuantity(line.id, line.quantity - 1)}
                        >
                          <Minus className="size-3.5" />
                        </Button>
                        <span className="w-8 text-center text-sm">{line.quantity}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 rounded-full"
                          aria-label="Increase quantity"
                          disabled={line.quantity >= line.stock}
                          onClick={() => void setQuantity(line.id, line.quantity + 1)}
                        >
                          <Plus className="size-3.5" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 text-muted-foreground"
                        onClick={() => void removeItem(line.id)}
                      >
                        <Trash2 className="size-3.5" /> Remove
                      </Button>
                    </div>
                  </div>
                  <p className="shrink-0 font-display text-lg font-semibold">
                    {formatPrice(unit * line.quantity)}
                  </p>
                </li>
              );
            })}
          </ul>

          <aside className="h-fit rounded-2xl border border-border bg-card p-6 shadow-soft lg:sticky lg:top-24">
            <h2 className="font-display text-lg font-semibold">Order summary</h2>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd>{formatPrice(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Delivery</dt>
                <dd>{shipping === 0 ? "Free" : formatPrice(shipping)}</dd>
              </div>
            </dl>
            <Separator className="my-5" />
            <div className="flex items-baseline justify-between">
              <span className="font-medium">Total</span>
              <span className="font-display text-2xl font-semibold">
                {formatPrice(subtotal + shipping)}
              </span>
            </div>
            <Button asChild className="mt-6 w-full rounded-full" size="lg">
              <Link to="/checkout">
                <ShoppingBag className="mr-2 size-4" /> Proceed to checkout
              </Link>
            </Button>
            <p className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5" /> Secure payments · Verified sellers
            </p>
          </aside>
        </div>
      </div>
    </SiteLayout>
  );
}

function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-secondary">
        <ShoppingBag className="size-7 text-secondary-foreground" />
      </span>
      <h1 className="mt-6 font-display text-2xl font-semibold">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{body}</p>
      <div className="mt-6">{action}</div>
    </div>
  );
}
