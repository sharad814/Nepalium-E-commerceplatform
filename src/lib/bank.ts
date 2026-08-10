/**
 * Bank transfer details shown at checkout.
 *
 * Edit these values with your own bank account. Drop your bank QR image at
 * `public/images/bank-qr.png` (any square image works) and it appears
 * automatically — the QR block is skipped when the file is missing.
 */
export const BANK_DETAILS = {
  bankName: "Nabil Bank Ltd.",
  accountHolder: "SHARAD PANDEY",
  accountNumber: "0000000000000000",
  branch: "",
  qrImage: "/images/bank-qr.png",
} as const;

/** True while the account number is still the placeholder above. */
export const isBankConfigured = (): boolean =>
  BANK_DETAILS.accountNumber.replace(/0/g, "").trim().length > 0;
