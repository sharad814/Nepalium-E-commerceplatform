/**
 * Branding is configurable in one place so the marketplace can be re-skinned
 * without touching component code.
 */
export const brand = {
  name: "Nepalium",
  tagline: "Nepal's marketplace for growers, makers and local sellers",
  shortDescription:
    "Buy organic produce, handicrafts, tea, tools and more directly from verified sellers across all seven provinces of Nepal.",
  currency: "Rs.",
  supportEmail: "support@nepalium.com",
  supportPhone: "+977 1 4000 000",
} as const;

export function formatPrice(value: number): string {
  return `${brand.currency} ${new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(Math.round(value))}`;
}

/** Final price after the product's discount. */
export function salePrice(price: number, discountPercent: number): number {
  return price - (price * discountPercent) / 100;
}
