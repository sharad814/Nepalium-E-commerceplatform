import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Banknote,
  Building2,
  CreditCard,
  Loader2,
  Lock,
  ShieldCheck,
  Upload,
  Wallet,
} from "lucide-react";
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
import { getPaymentConfig } from "@/lib/payment-config.functions";
import { BANK_DETAILS, isBankConfigured } from "@/lib/bank";

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

type Method = "cod" | "esewa" | "khalti" | "stripe" | "bank";
type WalletMode = "gateway" | "manual";
type GatewayConfig = Awaited<ReturnType<typeof getPaymentConfig>>;

const METHODS: { id: Method; label: string; hint: string; icon: typeof Wallet }[] = [
  { id: "cod", label: "Cash on delivery", hint: "Pay the rider when your parcel arrives", icon: Banknote },
  { id: "esewa", label: "eSewa", hint: "Scan our eSewa QR and share the transaction ID", icon: Wallet },
  { id: "khalti", label: "Khalti", hint: "Scan our Khalti QR and share the transaction ID", icon: Wallet },
  { id: "bank", label: "Bank transfer", hint: "Transfer to our bank and upload the receipt", icon: Building2 },
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
  const [walletMode, setWalletMode] = useState<WalletMode>("manual");
  const [transactionId, setTransactionId] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [config, setConfig] = useState<GatewayConfig | null>(null);
  const loadConfig = useServerFn(getPaymentConfig);

  useEffect(() => {
    let active = true;
    void loadConfig()
      .then((data) => {
        if (active) setConfig(data);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [loadConfig]);
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
    if (submitting) return;
    if (lines.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    const isWallet = method === "esewa" || method === "khalti";
    const manual = method === "bank" || (isWallet && walletMode === "manual");
    if (manual && transactionId.trim().length < 4) {
      toast.error("Enter the transaction / reference ID from your payment receipt");
      return;
    }
    setSubmitting(true);
    try {
      let receiptPath: string | undefined;
      if (method === "bank" && receipt && user) {
        const ext = receipt.name.split(".").pop()?.toLowerCase() ?? "jpg";
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("payment-receipts")
          .upload(path, receipt, { upsert: false, contentType: receipt.type });
        if (uploadError) throw new Error(`Receipt upload failed: ${uploadError.message}`);
        receiptPath = path;
      }
      const result = await submitOrder({
        data: {
          ...form,
          method,
          origin: window.location.origin,
          ...(isWallet ? { mode: walletMode } : {}),
          ...(manual ? { transactionId: transactionId.trim() } : {}),
          ...(receiptPath ? { receiptPath } : {}),
        },
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

              {(method === "esewa" || method === "khalti") && (
                <div className="mt-6 space-y-4">
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => setWalletMode("gateway")}
                      aria-pressed={walletMode === "gateway"}
                      className={`flex-1 rounded-xl border p-3 text-left text-sm transition ${
                        walletMode === "gateway"
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      <span className="block font-medium">
                        Pay with {QR_DETAILS[method].label}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        Official {QR_DETAILS[method].label} checkout — you are redirected to their
                        secure page.
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setWalletMode("manual")}
                      aria-pressed={walletMode === "manual"}
                      className={`flex-1 rounded-xl border p-3 text-left text-sm transition ${
                        walletMode === "manual"
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      <span className="block font-medium">Scan our QR instead</span>
                      <span className="block text-xs text-muted-foreground">
                        Pay from your wallet app, then share the transaction ID.
                      </span>
                    </button>
                  </div>

                  {walletMode === "gateway" && (
                    <div className="rounded-xl border border-border bg-muted/30 p-5 text-sm">
                      <p className="font-medium">
                        You will be redirected to {QR_DETAILS[method].label} to complete payment.
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        We never ask for your wallet password, PIN or OTP — those are entered only on
                        the provider&apos;s own page.
                      </p>
                      {method === "esewa" && config && !config.esewa.live && (
                        <p className="mt-3 rounded-lg bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
                          Configuration required: eSewa is running on the public test environment.
                          Add <code>ESEWA_PRODUCT_CODE</code> and <code>ESEWA_SECRET_KEY</code> to go
                          live.
                        </p>
                      )}
                      {method === "khalti" && config && !config.khalti.available && (
                        <p className="mt-3 rounded-lg bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
                          Configuration required: add <code>KHALTI_SECRET_KEY</code> before Khalti
                          online payments can work. Use the QR option in the meantime.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {(method === "esewa" || method === "khalti") && walletMode === "manual" && (
                <div className="mt-6 rounded-xl border border-border bg-muted/30 p-5">
                  <div className="grid gap-5 sm:grid-cols-[180px_1fr] sm:items-start">
                    <div className="mx-auto w-full max-w-[180px] rounded-xl border border-border bg-card p-3">
                      <img
                        src={QR_DETAILS[method].image}
                        alt={`${QR_DETAILS[method].label} payment QR code for Nepalium`}
                        className="aspect-square w-full rounded-lg object-contain"
                        loading="lazy"
                      />
                    </div>
                    <div className="space-y-3">
                      <div>
                        <p className="font-medium">
                          Scan this QR code with {QR_DETAILS[method].label} to pay
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {QR_DETAILS[method].account}
                        </p>
                      </div>
                      <p className="text-sm">
                        Amount to pay:{" "}
                        <span className="font-display text-lg font-semibold">
                          {formatPrice(total)}
                        </span>
                      </p>
                      <Field
                        label={`${QR_DETAILS[method].label} Transaction ID`}
                        id="transactionId"
                      >
                        <Input
                          id="transactionId"
                          required
                          value={transactionId}
                          onChange={(e) => setTransactionId(e.target.value)}
                          placeholder="e.g. 000AB1CD"
                        />
                      </Field>
                      <p className="text-xs text-muted-foreground">
                        Pay first, then paste the transaction/reference ID from your wallet receipt.
                        Your order stays pending until our team verifies the payment.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {method === "bank" && (
                <div className="mt-6 rounded-xl border border-border bg-muted/30 p-5">
                  <div className="grid gap-5 sm:grid-cols-[180px_1fr] sm:items-start">
                    <div className="mx-auto w-full max-w-[180px] rounded-xl border border-border bg-card p-3">
                      <img
                        src={BANK_DETAILS.qrImage}
                        alt="Bank payment QR code for Nepalium"
                        className="aspect-square w-full rounded-lg object-contain"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </div>
                    <div className="space-y-3 text-sm">
                      <dl className="grid gap-1">
                        <Row label="Bank" value={BANK_DETAILS.bankName} />
                        <Row label="Account holder" value={BANK_DETAILS.accountHolder} />
                        <Row label="Account number" value={BANK_DETAILS.accountNumber} />
                        <Row label="Amount" value={formatPrice(total)} />
                      </dl>
                      {!isBankConfigured() && (
                        <p className="rounded-lg bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400">
                          Configuration required: update the bank account details in
                          <code> src/lib/bank.ts</code> and add your bank QR at
                          <code> public/images/bank-qr.png</code>.
                        </p>
                      )}
                      <Field label="Transaction / reference number" id="transactionId">
                        <Input
                          id="transactionId"
                          required
                          value={transactionId}
                          onChange={(e) => setTransactionId(e.target.value)}
                          placeholder="Bank reference from your receipt"
                        />
                      </Field>
                      <Field label="Upload payment receipt (optional)" id="receipt">
                        <Input
                          id="receipt"
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={(e) => setReceipt(e.target.files?.[0] ?? null)}
                        />
                      </Field>
                      <p className="flex items-start gap-2 text-xs text-muted-foreground">
                        <Upload className="mt-0.5 size-3.5 shrink-0" />
                        Your order number is shown on the confirmation page — quote it in the transfer
                        remarks. The order stays pending verification until our team approves the
                        transfer.
                      </p>
                    </div>
                  </div>
                </div>
              )}

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
              {method === "cod"
                ? "Place order"
                : method === "bank"
                  ? `Submit transfer · ${formatPrice(total)}`
                  : `Pay ${formatPrice(total)}`}
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap justify-between gap-2 border-b border-border/60 py-1 last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium break-all">{value}</dd>
    </div>
  );
}
