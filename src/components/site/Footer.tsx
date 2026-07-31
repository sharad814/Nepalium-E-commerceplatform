import { Link } from "@tanstack/react-router";
import { Sprout, Mail, Phone, ShieldCheck, Truck, Wallet } from "lucide-react";
import { brand } from "@/lib/branding";

const COLUMNS = [
  {
    title: "Marketplace",
    links: [
      { label: "Shop all", to: "/shop" },
      { label: "Categories", to: "/categories" },
      { label: "Sellers", to: "/sellers" },
      { label: "Today's deals", to: "/shop" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About us", to: "/about" },
      { label: "Become a seller", to: "/become-seller" },
      { label: "Contact", to: "/contact" },
      { label: "FAQ", to: "/faq" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Sign in", to: "/auth" },
      { label: "My account", to: "/account" },
      { label: "Cart", to: "/cart" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-20 border-t border-border bg-surface">
      <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-brand text-primary-foreground">
              <Sprout className="size-5" />
            </span>
            <span className="font-display text-xl font-semibold">{brand.name}</span>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">{brand.shortDescription}</p>
          <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Mail className="size-4" /> {brand.supportEmail}
            </li>
            <li className="flex items-center gap-2">
              <Phone className="size-4" /> {brand.supportPhone}
            </li>
          </ul>
        </div>

        {COLUMNS.map((col) => (
          <div key={col.title}>
            <h3 className="font-display text-base font-semibold">{col.title}</h3>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-6 text-sm text-muted-foreground sm:px-6 md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} {brand.name}. All rights reserved.
          </p>
          <ul className="flex flex-wrap items-center gap-5">
            <li className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" /> Verified sellers
            </li>
            <li className="flex items-center gap-2">
              <Truck className="size-4 text-primary" /> Nationwide delivery
            </li>
            <li className="flex items-center gap-2">
              <Wallet className="size-4 text-primary" /> eSewa · Khalti · COD
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
