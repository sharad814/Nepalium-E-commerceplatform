import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Search,
  ShoppingCart,
  User as UserIcon,
  Menu,
  Store,
  LayoutDashboard,
  Shield,
  LogOut,
  Moon,
  Sun,
  Sprout,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { brand } from "@/lib/branding";

const NAV = [
  { label: "Home", to: "/" },
  { label: "Shop", to: "/shop" },
  { label: "Categories", to: "/categories" },
  { label: "Sellers", to: "/sellers" },
  { label: "About", to: "/about" },
];

function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const stored = window.localStorage.getItem("nepalium-theme");
    const isDark = stored === "dark";
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle dark mode"
      onClick={() => {
        const next = !dark;
        setDark(next);
        document.documentElement.classList.toggle("dark", next);
        window.localStorage.setItem("nepalium-theme", next ? "dark" : "light");
      }}
    >
      {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </Button>
  );
}

export function Header() {
  const navigate = useNavigate();
  const [term, setTerm] = useState("");
  const { user, profile, isAdmin, isSeller, signOut } = useAuth();
  const displayName = profile?.full_name || user?.email?.split("@")[0] || "Account";
  const { count } = useCart();

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    void navigate({ to: "/shop", search: { q: term || undefined } as never });
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/70 glass-panel">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4 sm:px-6">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-6">
            <nav className="mt-8 flex flex-col gap-1">
              {NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted"
                >
                  {item.label}
                </Link>
              ))}
              <Link
                to="/become-seller"
                className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted"
              >
                Become a seller
              </Link>
            </nav>
          </SheetContent>
        </Sheet>

        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-brand text-primary-foreground shadow-soft">
            <Sprout className="size-5" />
          </span>
          <span className="font-display text-xl font-semibold tracking-tight">{brand.name}</span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              activeProps={{ className: "text-foreground bg-muted" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <form onSubmit={submitSearch} className="ml-auto hidden max-w-md flex-1 md:block">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Search products, sellers, districts…"
              aria-label="Search products"
              className="h-10 rounded-full pl-9"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          <ThemeToggle />
          <Link to="/cart" aria-label="Cart" className="relative">
            <Button variant="ghost" size="icon">
              <ShoppingCart className="size-5" />
            </Button>
            {count > 0 && (
              <Badge className="absolute -right-1 -top-1 h-5 min-w-5 justify-center rounded-full bg-accent px-1 text-[11px] text-accent-foreground">
                {count}
              </Badge>
            )}
          </Link>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="ml-1 h-10 gap-2 rounded-full px-1.5 sm:pr-3" aria-label="Account menu">
                  <Avatar className="size-7">
                    {profile?.avatar_url ? (
                      <AvatarImage src={profile.avatar_url} alt={displayName} referrerPolicy="no-referrer" />
                    ) : null}
                    <AvatarFallback className="bg-gradient-brand text-[11px] text-primary-foreground">
                      {displayName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden max-w-28 truncate text-sm font-medium sm:inline">
                    {displayName}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="min-w-0">
                  <div className="truncate font-medium">{displayName}</div>
                  <div className="truncate text-xs font-normal text-muted-foreground">
                    {profile?.email ?? user.email}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/account">
                    <LayoutDashboard className="mr-2 size-4" /> My account
                  </Link>
                </DropdownMenuItem>
                {isSeller && (
                  <DropdownMenuItem asChild>
                    <Link to="/seller">
                      <Store className="mr-2 size-4" /> Seller dashboard
                    </Link>
                  </DropdownMenuItem>
                )}
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin">
                      <Shield className="mr-2 size-4" /> Admin panel
                    </Link>
                  </DropdownMenuItem>
                )}
                {!isSeller && (
                  <DropdownMenuItem asChild>
                    <Link to="/become-seller">
                      <Store className="mr-2 size-4" /> Become a seller
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    void (async () => {
                      await signOut();
                      void navigate({ to: "/" });
                    })();
                  }}
                >
                  <LogOut className="mr-2 size-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild size="sm" className="ml-1 rounded-full">
              <Link to="/auth">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
