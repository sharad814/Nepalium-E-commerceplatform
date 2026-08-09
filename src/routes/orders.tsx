import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Package } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatPrice } from "@/lib/branding";

export const Route = createFileRoute("/orders")({
  head: () => ({
    meta: [
      { title: "My orders — Nepalium" },
      { name: "description", content: "Track your Nepalium orders, payments and deliveries." },
      { property: "og:title", content: "My orders — Nepalium" },
      { property: "og:description", content: "Order history and payment status on Nepalium." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OrdersPage,
});

type PaymentRow = {
  id: string;
  payment_method: string;
  payment_status: string;
  transaction_id: string | null;
  created_at: string;
  updated_at: string;
  verified_at: string | null;
};

type OrderRow = {
  id: string;
  order_number: string;
  total: number;
  payment_method: string;
  payment_status: string;
  status: string;
  created_at: string;
  updated_at: string;
  order_items: { id: string; title: string; quantity: number }[];
  payments: PaymentRow[];
};

const paymentLabel: Record<string, string> = {
  pending: "Payment pending verification",
  paid: "Payment verified",
  failed: "Payment rejected",
  refunded: "Payment refunded",
};

function OrdersPage() {
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState<OrderRow[]>([]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    void supabase
      .from("orders")
      .select(
        "id,order_number,total,payment_method,payment_status,status,created_at,updated_at,order_items(id,title,quantity),payments(id,payment_method,payment_status,transaction_id,created_at,updated_at,verified_at)",
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (active) setOrders((data ?? []) as unknown as OrderRow[]);
      });
    return () => {
      active = false;
    };
  }, [user]);

  if (!loading && !user) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-md px-4 py-24 text-center">
          <h1 className="font-display text-2xl font-semibold">Sign in to see your orders</h1>
          <Button asChild className="mt-6 rounded-full">
            <Link to="/auth">Sign in</Link>
          </Button>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-3xl font-semibold sm:text-4xl">My orders</h1>
        {orders.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-border bg-card p-10 text-center shadow-soft">
            <Package className="mx-auto size-10 text-muted-foreground" />
            <p className="mt-4 text-sm text-muted-foreground">You have no orders yet.</p>
            <Button asChild className="mt-6 rounded-full">
              <Link to="/shop">Start shopping</Link>
            </Button>
          </div>
        ) : (
          <ul className="mt-8 space-y-4">
            {orders.map((order) => (
              <li key={order.id} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{order.order_number}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.created_at).toLocaleString()} ·{" "}
                      {order.order_items?.length ?? 0} item(s)
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="capitalize">
                      {order.payment_method === "cod" ? "Cash on delivery" : order.payment_method}
                    </Badge>
                    <Badge
                      variant={order.payment_status === "paid" ? "default" : "outline"}
                      className="capitalize"
                    >
                      {order.payment_status}
                    </Badge>
                    <Badge variant="outline" className="capitalize">
                      {order.status}
                    </Badge>
                    <span className="font-display text-lg font-semibold">
                      {formatPrice(Number(order.total))}
                    </span>
                  </div>
                </div>
                <p className="mt-3 truncate text-sm text-muted-foreground">
                  {(order.order_items ?? []).map((i) => `${i.quantity} × ${i.title}`).join(", ")}
                </p>
                {order.payment_status === "failed" && (
                  <Button asChild size="sm" variant="outline" className="mt-4 rounded-full">
                    <Link to="/payment/failed" search={{ order: order.id }}>
                      Retry payment
                    </Link>
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </SiteLayout>
  );
}
