import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Loader2, Package, XCircle } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatPrice } from "@/lib/branding";
import { verifyPayment } from "@/lib/orders.functions";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";

type Search = {
  order?: string | undefined;
  method?: string | undefined;
  session_id?: string | undefined;
  pidx?: string | undefined;
  data?: string | undefined;
};

function str(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export const Route = createFileRoute("/payment/success")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    order: str(search["order"]),
    method: str(search["method"]),
    session_id: str(search["session_id"]),
    pidx: str(search["pidx"]),
    data: str(search["data"]),
  }),
  head: () => ({
    meta: [
      { title: "Order confirmed — Nepalium" },
      {
        name: "description",
        content: "Your Nepalium order has been placed. Track the payment and delivery status here.",
      },
      { property: "og:title", content: "Order confirmed — Nepalium" },
      { property: "og:description", content: "Thank you for shopping with Nepali sellers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PaymentSuccessPage,
});

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | {
      status: "done";
      paid: boolean;
      cod: boolean;
      orderNumber: string;
      total: number;
      message: string;
    };

function PaymentSuccessPage() {
  const search = Route.useSearch();
  const { user, loading } = useAuth();
  const { clear } = useCart();
  const verify = useServerFn(verifyPayment);
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setState({ status: "error", message: "Please sign in to view this order." });
      return;
    }
    let active = true;
    void verify({
      data: {
        orderId: search.order,
        pidx: search.pidx,
        sessionId: search.session_id,
        esewaData: search.data,
      },
    })
      .then((result) => {
        if (!active) return;
        setState({
          status: "done",
          paid: result.paid,
          cod: result.method === "cod",
          orderNumber: result.orderNumber,
          total: result.total,
          message: result.message,
        });
        if (result.paid || result.method === "cod") void clear();
      })
      .catch((error: unknown) => {
        if (!active) return;
        setState({
          status: "error",
          message: error instanceof Error ? error.message : "We could not load this order.",
        });
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user, search.order, search.pidx, search.session_id, search.data]);

  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-xl px-4 py-16 text-center sm:px-6">
        {state.status === "loading" && (
          <>
            <Loader2 className="mx-auto size-10 animate-spin text-primary" />
            <h1 className="mt-6 font-display text-2xl font-semibold">Confirming your payment…</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Please keep this page open while we check with the payment provider.
            </p>
          </>
        )}

        {state.status === "error" && (
          <>
            <XCircle className="mx-auto size-12 text-destructive" />
            <h1 className="mt-6 font-display text-2xl font-semibold">Something went wrong</h1>
            <p className="mt-2 text-sm text-muted-foreground">{state.message}</p>
            <Button asChild className="mt-6 rounded-full">
              <Link to="/orders">Go to my orders</Link>
            </Button>
          </>
        )}

        {state.status === "done" && (
          <div className="rounded-2xl border border-border bg-card p-8 shadow-soft">
            {state.paid || state.cod ? (
              <CheckCircle2 className="mx-auto size-12 text-primary" />
            ) : (
              <XCircle className="mx-auto size-12 text-destructive" />
            )}
            <h1 className="mt-6 font-display text-2xl font-semibold">
              {state.paid
                ? "Payment successful"
                : state.cod
                  ? "Order placed"
                  : "Payment not confirmed"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">{state.message}</p>
            <Separator className="my-6" />
            <dl className="space-y-3 text-left text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Order number</dt>
                <dd className="font-medium">{state.orderNumber}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Amount</dt>
                <dd className="font-medium">{formatPrice(state.total)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Payment</dt>
                <dd className="font-medium">
                  {state.cod ? "Cash on delivery" : state.paid ? "Paid" : "Unpaid"}
                </dd>
              </div>
            </dl>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild className="rounded-full">
                <Link to="/orders">
                  <Package className="mr-2 size-4" /> Track my orders
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full">
                <Link to="/shop">Keep shopping</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
