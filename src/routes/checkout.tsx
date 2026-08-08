import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Banknote, CreditCard, Loader2, Lock, ShieldCheck, Wallet } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice, salePrice } from "@/lib/branding";
import { districtsOf, PROVINCES } from "@/lib/nepal";
import { createOrder } from "@/lib/orders.functions";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Nepalium" },
      {
        name: "description",
        content:
          "Confirm your delivery details and pay with eSewa, Khalti, card or cash on delivery on Nepalium.",
      },
      { property: "og:title", content: "Checkout — Nepalium" },
      { property: "og:description", content: "Secure checkout for Nepali sellers and buyers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CheckoutPage,
});

type Method = "cod" | "esewa" | "khalti" | "stripe";

const METHODS: { id: Method; label: string; hint: string; icon: typeof Wallet }[] = [
  { id: "cod", label: "Cash on delivery", hint: "Pay the rider when your parcel arrives", icon: Banknote },
  { id: "esewa", label: "eSewa", hint: "Scan our eSewa QR and share the transaction ID", icon: Wallet },
  { id: "khalti", label: "Khalti", hint: "Scan our Khalti QR and share the transaction ID", icon: Wallet },
  { id: "stripe", label: "Card (Stripe)", hint: "Visa, Mastercard and international cards", icon: CreditCard },
];

const QR_DETAILS: Record<"esewa" | "khalti", { label: string; image: string; account: string }> = {
  esewa: { label: "eSewa", image: "/images/esewa-qr.png", account: "Sharad Pandey · 9749781949" },
  khalti: { label: "Khalti", image: "/images/khalti-qr.png", account: "Sarad Pandey · 9749781949" },
};

function CheckoutPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { lines, subtotal, loading: cartLoading } = useCart();
  const submitOrder = useServerFn(createOrder);

  const [method, setMethod] = useState<Method>("cod");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    province: "",
    district: "",
    city: "",
    street: "",
    note: "",
  });

  useEffect(() => {
    if (!user) return;
    let active = true;
    void supabase
      .from("profiles")
      .select("full_name,phone,province,district")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!active || !data) return;
        setForm((prev) => ({
          ...prev,
          fullName: prev.fullName || data.full_name || "",
          phone: prev.phone || data.phone || "",
          province: prev.province || data.province || "",
          district: prev.district || data.district || "",
        }));
      });
    return () => {
      active = false;
    };
  }, [user]);

  const shipping = subtotal > 5000 || subtotal === 0 ? 0 : 150;
  const total = subtotal + shipping;
  const districts = useMemo(() => districtsOf(form.province), [form.province]);

  useEffect(() => {
    if (!authLoading && !user) void navigate({ to: "/auth" });
  }, [authLoading, user, navigate]);

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (lines.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    setSubmitting(true);
    try {
      const result = await submitOrder({
        data: { ...form, method, origin: window.location.origin },
      });
      if (!result.redirect) {
        await navigate({
          to: "/payment/success",
          search: { order: result.orderId, method },
        });
        return;
      }
      if (result.redirect.kind === "url") {
        window.location.href = result.redirect.url;
        return;
      }
      const gatewayForm = document.createElement("form");
      gatewayForm.method = "POST";
      gatewayForm.action = result.redirect.url;
      for (const [name, value] of Object.entries(result.redirect.fields)) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = value;
        gatewayForm.appendChild(input);
      }
      document.body.appendChild(gatewayForm);
      gatewayForm.submit();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not place your order");
      setSubmitting(false);
    }
  }

  if (!cartLoading && lines.length === 0) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-md px-4 py-24 text-center">
          <h1 className="font-display text-2xl font-semibold">Nothing to check out</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Add a few items to your cart and come back.
          </p>
          <Button asChild className="mt-6 rounded-full">
            <Link to="/shop">Browse the marketplace</Link>
          </Button>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <h1 className="font-display text-3xl font-semibold sm:text-4xl">Checkout</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Delivery across all seven provinces · Verified Nepali sellers
        </p>

        <form onSubmit={handleSubmit} className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <h2 className="font-display text-lg font-semibold">Delivery details</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Field label="Full name" id="fullName">
                  <Input
                    id="fullName"
                    required
                    value={form.fullName}
                    onChange={(e) => set("fullName")(e.target.value)}
                  />
                </Field>
                <Field label="Phone number" id="phone">
                  <Input
                    id="phone"
                    required
                    inputMode="tel"
                    placeholder="98XXXXXXXX"
                    value={form.phone}
                    onChange={(e) => set("phone")(e.target.value)}
                  />
                </Field>
                <Field label="Province" id="province">
                  <Select
                    value={form.province}
                    onValueChange={(v) => setForm((p) => ({ ...p, province: v, district: "" }))}
                  >
                    <SelectTrigger id="province">
                      <SelectValue placeholder="Select province" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROVINCES.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="District" id="district">
                  <Select
                    value={form.district}
                    onValueChange={set("district")}
                    disabled={!form.province}
                  >
                    <SelectTrigger id="district">
                      <SelectValue placeholder="Select district" />
                    </SelectTrigger>
                    <SelectContent>
                      {districts.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="City / municipality" id="city">
                  <Input
                    id="city"
                    required
                    value={form.city}
                    onChange={(e) => set("city")(e.target.value)}
                  />
                </Field>
                <Field label="Street / tole" id="street">
                  <Input
                    id="street"
                    required
                    value={form.street}
                    onChange={(e) => set("street")(e.target.value)}
                  />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Delivery note (optional)" id="note">
                    <Textarea
                      id="note"
                      rows={3}
                      placeholder="Landmark, preferred delivery time…"
                      value={form.note}
                      onChange={(e) => set("note")(e.target.value)}
                    />
                  </Field>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-card p-6 shadow-soft">
              <h2 className="font-display text-lg font-semibold">Payment method</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {METHODS.map((m) => {
                  const Icon = m.icon;
                  const active = method === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMethod(m.id)}
                      aria-pressed={active}
                      className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${
                        active
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      <Icon className="mt-0.5 size-5 text-primary" />
                      <span>
                        <span className="block font-medium">{m.label}</span>
                        <span className="block text-xs text-muted-foreground">{m.hint}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                <Lock className="size-3.5" /> Payments are verified on our servers before an order is
                confirmed.
              </p>
            </section>
          </div>

          <aside className="h-fit rounded-2xl border border-border bg-card p-6 shadow-soft lg:sticky lg:top-24">
            <h2 className="font-display text-lg font-semibold">Order summary</h2>
            <ul className="mt-4 space-y-3 text-sm">
              {lines.map((line) => (
                <li key={line.id} className="flex justify-between gap-3">
                  <span className="min-w-0 truncate text-muted-foreground">
                    {line.quantity} × {line.title}
                  </span>
                  <span>
                    {formatPrice(salePrice(line.price, line.discount_percent) * line.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <Separator className="my-5" />
            <dl className="space-y-3 text-sm">
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
              <span className="font-display text-2xl font-semibold">{formatPrice(total)}</span>
            </div>
            <Button type="submit" size="lg" className="mt-6 w-full rounded-full" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 size-4 animate-spin" />}
              {method === "cod" ? "Place order" : `Pay ${formatPrice(total)}`}
            </Button>
            <p className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5" /> Buyer protection on every order
            </p>
          </aside>
        </form>
      </div>
    </SiteLayout>
  );
}

function Field({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}
