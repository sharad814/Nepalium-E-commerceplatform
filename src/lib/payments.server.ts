/**
 * Payment gateway helpers. Server-only: never import from client code.
 *
 * eSewa uses its public RC (sandbox) credentials unless ESEWA_PRODUCT_CODE /
 * ESEWA_SECRET_KEY are provided. Khalti and Stripe need their own secrets.
 */

const ESEWA_RC_FORM = "https://rc-epay.esewa.com.np/api/epay/main/v2/form";
const ESEWA_RC_STATUS = "https://rc.esewa.com.np/api/epay/transaction/status/";
const ESEWA_LIVE_FORM = "https://epay.esewa.com.np/api/epay/main/v2/form";
const ESEWA_LIVE_STATUS = "https://epay.esewa.com.np/api/epay/transaction/status/";

function esewaConfig() {
  const productCode = process.env["ESEWA_PRODUCT_CODE"] ?? "EPAYTEST";
  const secret = process.env["ESEWA_SECRET_KEY"] ?? "8gBm/:&EnhH.1/q";
  const live = productCode !== "EPAYTEST";
  return {
    productCode,
    secret,
    formUrl: live ? ESEWA_LIVE_FORM : ESEWA_RC_FORM,
    statusUrl: live ? ESEWA_LIVE_STATUS : ESEWA_RC_STATUS,
  };
}

async function hmacSha256Base64(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  let binary = "";
  for (const byte of new Uint8Array(sig)) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export type GatewayRedirect =
  | { kind: "form"; url: string; fields: Record<string, string> }
  | { kind: "url"; url: string };

export async function esewaForm(params: {
  amount: number;
  transactionUuid: string;
  successUrl: string;
  failureUrl: string;
}): Promise<GatewayRedirect> {
  const { productCode, secret, formUrl } = esewaConfig();
  const total = String(Math.round(params.amount));
  const message = `total_amount=${total},transaction_uuid=${params.transactionUuid},product_code=${productCode}`;
  const signature = await hmacSha256Base64(secret, message);
  return {
    kind: "form",
    url: formUrl,
    fields: {
      amount: total,
      tax_amount: "0",
      total_amount: total,
      transaction_uuid: params.transactionUuid,
      product_code: productCode,
      product_service_charge: "0",
      product_delivery_charge: "0",
      success_url: params.successUrl,
      failure_url: params.failureUrl,
      signed_field_names: "total_amount,transaction_uuid,product_code",
      signature,
    },
  };
}

export async function esewaVerify(
  transactionUuid: string,
  amount: number,
): Promise<{ paid: boolean; raw: unknown }> {
  const { productCode, statusUrl } = esewaConfig();
  const url = `${statusUrl}?product_code=${encodeURIComponent(productCode)}&total_amount=${Math.round(
    amount,
  )}&transaction_uuid=${encodeURIComponent(transactionUuid)}`;
  const res = await fetch(url);
  const raw = (await res.json().catch(() => ({}))) as { status?: string };
  return { paid: raw?.status === "COMPLETE", raw };
}

function khaltiConfig() {
  const secret = process.env["KHALTI_SECRET_KEY"];
  if (!secret) return null;
  const live = process.env["KHALTI_ENV"] === "live";
  return {
    secret,
    base: live ? "https://khalti.com/api/v2" : "https://dev.khalti.com/api/v2",
  };
}

export function isKhaltiConfigured(): boolean {
  return khaltiConfig() !== null;
}

export async function khaltiInitiate(params: {
  amount: number;
  orderId: string;
  orderNumber: string;
  returnUrl: string;
  websiteUrl: string;
  customerName: string;
  customerPhone: string;
}): Promise<{ redirect: GatewayRedirect; pidx: string }> {
  const cfg = khaltiConfig();
  if (!cfg) throw new Error("Khalti is not configured yet. Add a Khalti secret key to enable it.");
  const res = await fetch(`${cfg.base}/epayment/initiate/`, {
    method: "POST",
    headers: { Authorization: `key ${cfg.secret}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      return_url: params.returnUrl,
      website_url: params.websiteUrl,
      amount: Math.round(params.amount * 100),
      purchase_order_id: params.orderId,
      purchase_order_name: params.orderNumber,
      customer_info: { name: params.customerName, phone: params.customerPhone },
    }),
  });
  const json = (await res.json().catch(() => ({}))) as { pidx?: string; payment_url?: string };
  if (!res.ok || !json.payment_url || !json.pidx) {
    throw new Error("Khalti could not start this payment. Please try another method.");
  }
  return { redirect: { kind: "url", url: json.payment_url }, pidx: json.pidx };
}

export async function khaltiVerify(pidx: string): Promise<{ paid: boolean; raw: unknown }> {
  const cfg = khaltiConfig();
  if (!cfg) return { paid: false, raw: { error: "not_configured" } };
  const res = await fetch(`${cfg.base}/epayment/lookup/`, {
    method: "POST",
    headers: { Authorization: `key ${cfg.secret}`, "Content-Type": "application/json" },
    body: JSON.stringify({ pidx }),
  });
  const raw = (await res.json().catch(() => ({}))) as { status?: string };
  return { paid: raw?.status === "Completed", raw };
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env["STRIPE_SECRET_KEY"]);
}

/** Rupees -> the smallest currency unit Stripe expects. */
export async function stripeCheckout(params: {
  amount: number;
  orderId: string;
  orderNumber: string;
  successUrl: string;
  cancelUrl: string;
  email?: string | null;
}): Promise<GatewayRedirect> {
  const key = process.env["STRIPE_SECRET_KEY"];
  if (!key) throw new Error("Card payments are not switched on yet for this store.");
  const body = new URLSearchParams({
    mode: "payment",
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    client_reference_id: params.orderId,
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": "npr",
    "line_items[0][price_data][unit_amount]": String(Math.round(params.amount * 100)),
    "line_items[0][price_data][product_data][name]": `Nepalium order ${params.orderNumber}`,
    "metadata[order_id]": params.orderId,
  });
  if (params.email) body.set("customer_email", params.email);
  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  const json = (await res.json().catch(() => ({}))) as { url?: string; id?: string };
  if (!res.ok || !json.url) throw new Error("Stripe could not start this payment.");
  return { kind: "url", url: json.url };
}

export async function stripeVerify(sessionId: string): Promise<{ paid: boolean; raw: unknown }> {
  const key = process.env["STRIPE_SECRET_KEY"];
  if (!key) return { paid: false, raw: { error: "not_configured" } };
  const res = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  const raw = (await res.json().catch(() => ({}))) as { payment_status?: string };
  return { paid: raw?.payment_status === "paid", raw };
}
