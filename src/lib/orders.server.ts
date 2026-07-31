import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import {
  esewaForm,
  esewaVerify,
  khaltiInitiate,
  khaltiVerify,
  stripeCheckout,
  stripeVerify,
  type GatewayRedirect,
} from "./payments.server";

type Client = SupabaseClient<Database>;
type Method = Database["public"]["Enums"]["payment_method"];

export type PlaceOrderInput = {
  fullName: string;
  phone: string;
  province: string;
  district: string;
  city: string;
  street: string;
  note?: string | undefined;
  method: Method;
  origin: string;
};

export type PlaceOrderResult = {
  orderId: string;
  orderNumber: string;
  total: number;
  method: Method;
  redirect: GatewayRedirect | null;
};

const DELIVERY_FEE = 150;
const FREE_DELIVERY_OVER = 5000;

function deliveryFee(subtotal: number): number {
  return subtotal <= 0 || subtotal > FREE_DELIVERY_OVER ? 0 : DELIVERY_FEE;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

type CartRow = {
  id: string;
  product_id: string;
  quantity: number;
  products: {
    id: string;
    title: string;
    price: number;
    discount_percent: number;
    stock: number;
    images: string[] | null;
    store_id: string | null;
    status: string;
  } | null;
};

async function loadCart(supabase: Client, userId: string) {
  const { data, error } = await supabase
    .from("cart_items")
    .select("id,product_id,quantity,products(id,title,price,discount_percent,stock,images,store_id,status)")
    .eq("user_id", userId)
    .order("created_at");
  if (error) throw new Error(error.message);
  const rows = ((data ?? []) as unknown as CartRow[]).filter((r) => r.products);
  if (rows.length === 0) throw new Error("Your cart is empty.");

  const items = rows.map((row) => {
    const p = row.products!;
    const unit = round2(Number(p.price) - (Number(p.price) * p.discount_percent) / 100);
    const quantity = Math.min(row.quantity, Math.max(p.stock, 0));
    if (quantity < 1) throw new Error(`${p.title} is out of stock.`);
    return {
      product_id: p.id,
      store_id: p.store_id,
      title: p.title,
      image: p.images?.[0] ?? null,
      unit_price: unit,
      quantity,
    };
  });
  const subtotal = round2(items.reduce((s, i) => s + i.unit_price * i.quantity, 0));
  return { items, subtotal };
}

async function buildRedirect(
  order: { id: string; order_number: string; total: number; payment_method: Method },
  buyer: { name: string; phone: string; email?: string | null },
  origin: string,
): Promise<GatewayRedirect | null> {
  const successUrl = `${origin}/payment/success?order=${order.id}&method=${order.payment_method}`;
  const failureUrl = `${origin}/payment/failed?order=${order.id}&method=${order.payment_method}`;
  const amount = Number(order.total);

  switch (order.payment_method) {
    case "cod":
      return null;
    case "esewa":
      return esewaForm({
        amount,
        transactionUuid: order.order_number,
        successUrl,
        failureUrl,
      });
    case "khalti": {
      const { redirect } = await khaltiInitiate({
        amount,
        orderId: order.id,
        orderNumber: order.order_number,
        returnUrl: successUrl,
        websiteUrl: origin,
        customerName: buyer.name,
        customerPhone: buyer.phone,
      });
      return redirect;
    }
    case "stripe":
      return stripeCheckout({
        amount,
        orderId: order.id,
        orderNumber: order.order_number,
        successUrl: `${successUrl}&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: failureUrl,
        email: buyer.email ?? null,
      });
    default:
      return null;
  }
}

export async function placeOrder(
  supabase: Client,
  userId: string,
  input: PlaceOrderInput,
): Promise<PlaceOrderResult> {
  const { items, subtotal } = await loadCart(supabase, userId);
  const fee = deliveryFee(subtotal);
  const total = round2(subtotal + fee);

  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      user_id: userId,
      full_name: input.fullName,
      phone: input.phone,
      province: input.province,
      district: input.district,
      city: input.city,
      street: input.street,
      note: input.note || null,
      subtotal,
      delivery_fee: fee,
      total,
      payment_method: input.method,
      payment_status: "pending",
    })
    .select("id,order_number,total,payment_method")
    .single();
  if (error || !order) throw new Error(error?.message ?? "Could not create your order.");

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(items.map((i) => ({ ...i, order_id: order.id })));
  if (itemsError) throw new Error(itemsError.message);

  let redirect: GatewayRedirect | null = null;
  try {
    redirect = await buildRedirect(
      { ...order, total: Number(order.total) },
      { name: input.fullName, phone: input.phone },
      input.origin,
    );
  } catch (gatewayError) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("orders").update({ payment_status: "failed" }).eq("id", order.id);
    throw gatewayError;
  }

  // Cash on delivery orders are confirmed immediately; the cart is cleared once
  // the order exists so a failed gateway hand-off never loses the basket.
  if (input.method === "cod") {
    await supabase.from("cart_items").delete().eq("user_id", userId);
  }

  return {
    orderId: order.id,
    orderNumber: order.order_number,
    total: Number(order.total),
    method: order.payment_method,
    redirect,
  };
}

export async function startGatewayPayment(
  supabase: Client,
  userId: string,
  orderId: string,
  origin: string,
): Promise<GatewayRedirect | null> {
  const { data: order, error } = await supabase
    .from("orders")
    .select("id,order_number,total,payment_method,full_name,phone,payment_status,user_id")
    .eq("id", orderId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!order || order.user_id !== userId) throw new Error("Order not found.");
  if (order.payment_status === "paid") return null;
  return buildRedirect(
    {
      id: order.id,
      order_number: order.order_number,
      total: Number(order.total),
      payment_method: order.payment_method,
    },
    { name: order.full_name, phone: order.phone },
    origin,
  );
}

export type ConfirmInput = {
  orderId?: string | undefined;
  orderNumber?: string | undefined;
  pidx?: string | undefined;
  sessionId?: string | undefined;
  esewaData?: string | undefined;
};

export type ConfirmResult = {
  paid: boolean;
  orderId: string;
  orderNumber: string;
  total: number;
  method: Method;
  message: string;
};

function decodeEsewaData(encoded: string): { transaction_uuid?: string; status?: string } {
  try {
    return JSON.parse(atob(encoded)) as { transaction_uuid?: string; status?: string };
  } catch {
    return {};
  }
}

export async function confirmPayment(
  supabase: Client,
  userId: string,
  input: ConfirmInput,
): Promise<ConfirmResult> {
  const decoded = input.esewaData ? decodeEsewaData(input.esewaData) : {};
  const orderNumber = input.orderNumber ?? decoded.transaction_uuid;

  let query = supabase
    .from("orders")
    .select("id,order_number,total,payment_method,payment_status,user_id");
  query = input.orderId ? query.eq("id", input.orderId) : query.eq("order_number", orderNumber ?? "");
  const { data: order, error } = await query.maybeSingle();
  if (error) throw new Error(error.message);
  if (!order || order.user_id !== userId) throw new Error("Order not found.");

  const amount = Number(order.total);
  const base = {
    orderId: order.id,
    orderNumber: order.order_number,
    total: amount,
    method: order.payment_method,
  };

  if (order.payment_status === "paid") {
    return { ...base, paid: true, message: "This order is already paid." };
  }
  if (order.payment_method === "cod") {
    return { ...base, paid: false, message: "You will pay cash when the order is delivered." };
  }

  let result: { paid: boolean; raw: unknown };
  if (order.payment_method === "esewa") {
    result = await esewaVerify(order.order_number, amount);
  } else if (order.payment_method === "khalti") {
    result = input.pidx
      ? await khaltiVerify(input.pidx)
      : { paid: false, raw: { error: "missing_pidx" } };
  } else {
    result = input.sessionId
      ? await stripeVerify(input.sessionId)
      : { paid: false, raw: { error: "missing_session" } };
  }

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin
    .from("orders")
    .update({
      payment_status: result.paid ? "paid" : "failed",
      status: result.paid ? "confirmed" : "placed",
      payment_ref: input.pidx ?? input.sessionId ?? order.order_number,
      payment_payload: result.raw as never,
    })
    .eq("id", order.id);

  if (result.paid) {
    await supabase.from("cart_items").delete().eq("user_id", userId);
  }

  return {
    ...base,
    paid: result.paid,
    message: result.paid
      ? "Payment confirmed."
      : "We could not confirm this payment with the provider.",
  };
}
