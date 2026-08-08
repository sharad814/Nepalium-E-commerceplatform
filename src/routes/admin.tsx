import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Check, ShieldAlert, Store, Package, Wallet, X } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatPrice } from "@/lib/branding";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin console — Nepalium" },
      {
        name: "description",
        content: "Review seller applications and approve product listings on Nepalium.",
      },
      { property: "og:title", content: "Admin console — Nepalium" },
      { property: "og:description", content: "Moderate sellers and products on Nepalium." },
    ],
  }),
  component: AdminPage,
});

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const applications = useQuery({
    queryKey: ["admin-applications"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seller_applications")
        .select("id,user_id,store_name,description,province,district,phone,status,created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const pendingProducts = useQuery({
    queryKey: ["admin-products"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id,title,price,stock,status,created_at,stores(name)")
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as {
        id: string;
        title: string;
        price: number;
        stock: number;
        status: string;
        stores: { name: string } | null;
      }[];
    },
  });

  const payments = useQuery({
    queryKey: ["admin-payments"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select(
          "id,order_id,user_id,payment_method,amount,transaction_id,payment_status,created_at,verified_at,orders(order_number,full_name,phone)",
        )
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as {
        id: string;
        order_id: string;
        payment_method: string;
        amount: number;
        transaction_id: string | null;
        payment_status: string;
        created_at: string;
        orders: { order_number: string; full_name: string; phone: string } | null;
      }[];
    },
  });

  if (loading || !user) return null;

  if (!isAdmin) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-md px-4 py-24 text-center">
          <ShieldAlert className="mx-auto size-10 text-muted-foreground" />
          <h1 className="mt-5 font-display text-2xl font-semibold">Admins only</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This console is restricted to Nepalium administrators.
          </p>
        </div>
      </SiteLayout>
    );
  }

  const decideApplication = async (
    app: NonNullable<typeof applications.data>[number],
    approve: boolean,
  ) => {
    if (approve) {
      const { error: storeError } = await supabase.from("stores").insert({
        owner_id: app.user_id,
        name: app.store_name,
        slug: `${slugify(app.store_name)}-${Math.random().toString(36).slice(2, 6)}`,
        description: app.description,
        province: app.province,
        district: app.district,
      });
      if (storeError) {
        toast.error(storeError.message);
        return;
      }
      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({ user_id: app.user_id, role: "seller" });
      if (roleError && !roleError.message.includes("duplicate")) {
        toast.error(roleError.message);
        return;
      }
    }
    const { error } = await supabase
      .from("seller_applications")
      .update({ status: approve ? "approved" : "rejected", reviewed_at: new Date().toISOString() })
      .eq("id", app.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(approve ? "Seller approved" : "Application rejected");
    void qc.invalidateQueries({ queryKey: ["admin-applications"] });
  };

  const decideProduct = async (id: string, approve: boolean) => {
    const { error } = await supabase
      .from("products")
      .update({ status: approve ? "approved" : "rejected" })
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(approve ? "Product published" : "Product rejected");
    void qc.invalidateQueries({ queryKey: ["admin-products"] });
  };

  const decidePayment = async (
    payment: NonNullable<typeof payments.data>[number],
    approve: boolean,
  ) => {
    const { error } = await supabase
      .from("payments")
      .update({
        payment_status: approve ? "paid" : "failed",
        verified_at: approve ? new Date().toISOString() : null,
      })
      .eq("id", payment.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    const { error: orderError } = await supabase
      .from("orders")
      .update({
        payment_status: approve ? "paid" : "failed",
        status: approve ? "confirmed" : "placed",
        payment_ref: payment.transaction_id,
      })
      .eq("id", payment.order_id);
    if (orderError) toast.error(orderError.message);
    toast.success(approve ? "Payment verified" : "Payment rejected");
    void qc.invalidateQueries({ queryKey: ["admin-payments"] });
  };

  const apps = applications.data ?? [];
  const pendingApps = apps.filter((a) => a.status === "pending");
  const paymentRows = payments.data ?? [];
  const pendingPayments = paymentRows.filter((p) => p.payment_status === "pending");


  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <h1 className="font-display text-3xl font-semibold">Admin console</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Approve sellers and moderate product listings before they reach buyers.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Store, label: "Pending sellers", value: pendingApps.length },
            { icon: Package, label: "Pending products", value: pendingProducts.data?.length ?? 0 },
            { icon: Wallet, label: "Pending payments", value: pendingPayments.length },
            { icon: Check, label: "Total applications", value: apps.length },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <s.icon className="size-5 text-primary" />
              <p className="mt-3 font-display text-2xl font-semibold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        <Tabs defaultValue="sellers" className="mt-10">
          <TabsList>
            <TabsTrigger value="sellers">Seller applications</TabsTrigger>
            <TabsTrigger value="products">Product approvals</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
          </TabsList>


          <TabsContent value="sellers" className="pt-6">
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Store</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apps.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.store_name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {a.district ?? "—"}
                        {a.province ? `, ${a.province}` : ""}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            a.status === "approved"
                              ? "secondary"
                              : a.status === "rejected"
                                ? "destructive"
                                : "outline"
                          }
                          className="capitalize"
                        >
                          {a.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {a.status === "pending" && (
                          <div className="flex justify-end gap-2">
                            <Button size="sm" onClick={() => void decideApplication(a, true)}>
                              <Check className="mr-1 size-3.5" /> Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => void decideApplication(a, false)}
                            >
                              <X className="mr-1 size-3.5" /> Reject
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {apps.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="py-12 text-center text-muted-foreground">
                        No seller applications yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="products" className="pt-6">
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Store</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(pendingProducts.data ?? []).map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.title}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {p.stores?.name ?? "—"}
                      </TableCell>
                      <TableCell>{formatPrice(Number(p.price))}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" onClick={() => void decideProduct(p.id, true)}>
                            <Check className="mr-1 size-3.5" /> Publish
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => void decideProduct(p.id, false)}
                          >
                            <X className="mr-1 size-3.5" /> Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(pendingProducts.data ?? []).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="py-12 text-center text-muted-foreground">
                        Nothing waiting for approval.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="payments" className="pt-6">
            <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-soft">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentRows.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">
                        {p.orders?.order_number ?? p.order_id.slice(0, 8)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {p.orders?.full_name ?? "—"}
                      </TableCell>
                      <TableCell>{formatPrice(Number(p.amount))}</TableCell>
                      <TableCell className="uppercase">{p.payment_method}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {p.transaction_id ?? "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            p.payment_status === "paid"
                              ? "secondary"
                              : p.payment_status === "failed"
                                ? "destructive"
                                : "outline"
                          }
                          className="capitalize"
                        >
                          {p.payment_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(p.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {p.payment_status === "pending" &&
                          (p.payment_method === "esewa" || p.payment_method === "khalti") && (
                            <div className="flex justify-end gap-2">
                              <Button size="sm" onClick={() => void decidePayment(p, true)}>
                                <Check className="mr-1 size-3.5" /> Verify
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => void decidePayment(p, false)}
                              >
                                <X className="mr-1 size-3.5" /> Reject
                              </Button>
                            </div>
                          )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {paymentRows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="py-12 text-center text-muted-foreground">
                        No payments recorded yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>

      </div>
    </SiteLayout>
  );
}
