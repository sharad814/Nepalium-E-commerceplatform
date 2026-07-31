import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Loader2, Package, Plus, Store, Boxes, Clock } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { fetchCategories } from "@/lib/catalog";
import { formatPrice } from "@/lib/branding";

export const Route = createFileRoute("/seller")({
  head: () => ({
    meta: [
      { title: "Seller dashboard — Nepalium" },
      {
        name: "description",
        content: "Manage your Nepalium store: add products, track stock and monitor approvals.",
      },
      { property: "og:title", content: "Seller dashboard — Nepalium" },
      { property: "og:description", content: "Manage your store, products and stock." },
    ],
  }),
  component: SellerDashboard,
});

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

function SellerDashboard() {
  const { user, isSeller, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [categoryId, setCategoryId] = useState("");

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const categories = useQuery({ queryKey: ["categories"], queryFn: fetchCategories });

  const store = useQuery({
    queryKey: ["my-store", user?.id],
    enabled: Boolean(user) && isSeller,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stores")
        .select("id,name,slug,province,district,rating")
        .eq("owner_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const products = useQuery({
    queryKey: ["my-products", store.data?.id],
    enabled: Boolean(store.data?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id,title,slug,price,stock,status,created_at,rejection_reason")
        .eq("store_id", store.data!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  if (loading || !user) return null;

  if (!isSeller) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-md px-4 py-24 text-center">
          <Store className="mx-auto size-10 text-muted-foreground" />
          <h1 className="mt-5 font-display text-2xl font-semibold">Seller access required</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Apply for a store and an admin will review it within 48 hours.
          </p>
          <Button asChild className="mt-6 rounded-full">
            <Link to="/become-seller">Apply to sell</Link>
          </Button>
        </div>
      </SiteLayout>
    );
  }

  const addProduct = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!store.data) return;
    const form = new FormData(e.currentTarget);
    const title = String(form.get("title"));
    setBusy(true);
    const { error } = await supabase.from("products").insert({
      store_id: store.data.id,
      title,
      slug: `${slugify(title)}-${Math.random().toString(36).slice(2, 7)}`,
      description: String(form.get("description")),
      price: Number(form.get("price")),
      stock: Number(form.get("stock")),
      discount_percent: Number(form.get("discount") || 0),
      category_id: categoryId || null,
      province: store.data.province,
      district: store.data.district,
      images: form.get("image") ? [String(form.get("image"))] : [],
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    (e.target as HTMLFormElement).reset();
    toast.success("Product submitted for admin approval");
    void queryClient.invalidateQueries({ queryKey: ["my-products"] });
  };

  const rows = products.data ?? [];
  const stats = [
    { icon: Package, label: "Products", value: rows.length },
    {
      icon: Clock,
      label: "Pending approval",
      value: rows.filter((r) => r.status === "pending").length,
    },
    {
      icon: Boxes,
      label: "Units in stock",
      value: rows.reduce((sum, r) => sum + r.stock, 0),
    },
  ];

  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold">Seller dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {store.data ? `${store.data.name} · ${store.data.district ?? "Nepal"}` : "Loading…"}
            </p>
          </div>
          {store.data && (
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/store/$slug" params={{ slug: store.data.slug }}>
                View public store
              </Link>
            </Button>
          )}
        </header>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <s.icon className="size-5 text-primary" />
              <p className="mt-3 font-display text-2xl font-semibold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[380px_1fr]">
          <form
            onSubmit={addProduct}
            className="h-fit space-y-4 rounded-3xl border border-border bg-card p-6 shadow-soft"
          >
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
              <Plus className="size-4" /> Add a product
            </h2>
            <div>
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" required className="mt-2" />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" rows={3} className="mt-2" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="price">Price (Rs.)</Label>
                <Input id="price" name="price" type="number" min={1} required className="mt-2" />
              </div>
              <div>
                <Label htmlFor="stock">Stock</Label>
                <Input id="stock" name="stock" type="number" min={0} required className="mt-2" />
              </div>
            </div>
            <div>
              <Label htmlFor="discount">Discount %</Label>
              <Input
                id="discount"
                name="discount"
                type="number"
                min={0}
                max={90}
                defaultValue={0}
                className="mt-2"
              />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {(categories.data ?? []).map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="image">Image URL</Label>
              <Input id="image" name="image" type="url" className="mt-2" />
            </div>
            <Button type="submit" className="w-full rounded-full" disabled={busy}>
              {busy && <Loader2 className="mr-2 size-4 animate-spin" />} Submit for approval
            </Button>
          </form>

          <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-soft">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.title}</TableCell>
                    <TableCell>{formatPrice(Number(p.price))}</TableCell>
                    <TableCell>{p.stock}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          p.status === "approved"
                            ? "secondary"
                            : p.status === "rejected"
                              ? "destructive"
                              : "outline"
                        }
                        className="capitalize"
                      >
                        {p.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-12 text-center text-muted-foreground">
                      No products yet — add your first listing.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
