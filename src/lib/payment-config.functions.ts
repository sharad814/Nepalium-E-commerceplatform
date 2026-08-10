import { createServerFn } from "@tanstack/react-start";

/**
 * Tells the checkout UI which official payment gateways have real merchant
 * credentials configured. Nothing secret is returned — only booleans.
 *
 * eSewa runs on its public sandbox (`EPAYTEST`) until ESEWA_PRODUCT_CODE and
 * ESEWA_SECRET_KEY are set. Khalti needs KHALTI_SECRET_KEY.
 */
export const getPaymentConfig = createServerFn({ method: "GET" }).handler(async () => {
  const esewaProductCode = process.env["ESEWA_PRODUCT_CODE"] ?? "EPAYTEST";
  return {
    esewa: { available: true, live: esewaProductCode !== "EPAYTEST" },
    khalti: { available: Boolean(process.env["KHALTI_SECRET_KEY"]) },
    stripe: { available: Boolean(process.env["STRIPE_SECRET_KEY"]) },
  };
});
