import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  placeOrder,
  startGatewayPayment,
  confirmPayment,
  type PlaceOrderInput,
} from "./orders.server";

const addressSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(7).max(20),
  province: z.string().trim().min(2).max(60),
  district: z.string().trim().min(2).max(60),
  city: z.string().trim().min(2).max(80),
  street: z.string().trim().min(3).max(200),
  note: z.string().trim().max(500).optional().default(""),
  method: z.enum(["cod", "stripe", "esewa", "khalti", "bank"]),
  origin: z.string().url(),
  transactionId: z.string().trim().max(80).optional(),
  mode: z.enum(["gateway", "manual"]).optional(),
  receiptPath: z.string().trim().max(300).optional(),
}).superRefine((value, ctx) => {
  const needsRef =
    value.method === "bank" ||
    ((value.method === "esewa" || value.method === "khalti") && value.mode !== "gateway");
  if (needsRef && (value.transactionId ?? "").length < 4) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["transactionId"],
      message: "Enter the transaction / reference ID from your payment receipt.",
    });
  }
});

export const createOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => addressSchema.parse(data))
  .handler(async ({ data, context }) =>
    placeOrder(context.supabase, context.userId, data as PlaceOrderInput),
  );

export const retryPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ orderId: z.string().uuid(), origin: z.string().url() }).parse(data),
  )
  .handler(async ({ data, context }) =>
    startGatewayPayment(context.supabase, context.userId, data.orderId, data.origin),
  );

export const verifyPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        orderId: z.string().uuid().optional(),
        orderNumber: z.string().max(40).optional(),
        pidx: z.string().max(100).optional(),
        sessionId: z.string().max(200).optional(),
        esewaData: z.string().max(4000).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => confirmPayment(context.supabase, context.userId, data));
