import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, RefreshCw, XCircle } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { retryPayment } from "@/lib/orders.functions";

type Search = { order?: string | undefined; method?: string | undefined };

function str(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export const Route = createFileRoute("/payment/failed")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    order: str(search["order"]),
    method: str(search["method"]),
  }),
  head: () => ({
    meta: [
      { title: "Payment failed — Nepalium" },
      {
        name: "description",
        content: "Your Nepalium payment could not be completed. Retry or choose another method.",
      },
      { property: "og:title", content: "Payment failed — Nepalium" },
      { property: "og:description", content: "Retry your Nepalium payment or pay on delivery." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PaymentFailedPage,
});

function PaymentFailedPage() {
  const { order } = Route.useSearch();
  const retry = useServerFn(retryPayment);
  const [busy, setBusy] = useState(false);

  async function handleRetry() {
    if (!order) return;
    setBusy(true);
    try {
      const redirect = await retry({ data: { orderId: order, origin: window.location.origin } });
      if (!redirect) {
        toast.success("This order is already paid.");
        setBusy(false);
        return;
      }
      if (redirect.kind === "url") {
        window.location.href = redirect.url;
        return;
      }
      const form = document.createElement("form");
      form.method = "POST";
      form.action = redirect.url;
      for (const [name, value] of Object.entries(redirect.fields)) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = value;
        form.appendChild(input);
      }
      document.body.appendChild(form);
      form.submit();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not restart the payment");
      setBusy(false);
    }
  }

  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-xl px-4 py-16 text-center sm:px-6">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-soft">
          <XCircle className="mx-auto size-12 text-destructive" />
          <h1 className="mt-6 font-display text-2xl font-semibold">Payment failed</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your order is saved but unpaid. You can retry the payment or choose cash on delivery
            instead.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {order && (
              <Button className="rounded-full" disabled={busy} onClick={() => void handleRetry()}>
                {busy ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 size-4" />
                )}
                Retry payment
              </Button>
            )}
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/orders">View my orders</Link>
            </Button>
            <Button asChild variant="ghost" className="rounded-full">
              <Link to="/cart">Back to cart</Link>
            </Button>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
