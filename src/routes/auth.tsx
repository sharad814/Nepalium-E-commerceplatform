import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, Mail, Lock, User as UserIcon, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";
import { brand } from "@/lib/branding";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in or create an account — Nepalium" },
      {
        name: "description",
        content:
          "Sign in to Nepalium to track orders, manage your cart and sell to customers across Nepal.",
      },
      { property: "og:title", content: "Sign in or create an account — Nepalium" },
      {
        property: "og:description",
        content: "Access your Nepalium buyer or seller account.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) void navigate({ to: "/" });
  }, [user, loading, navigate]);

  const signIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: String(form.get("email")),
      password: String(form.get("password")),
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back!");
    void navigate({ to: "/" });
  };

  const signUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email: String(form.get("email")),
      password: String(form.get("password")),
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: String(form.get("full_name")) },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account created — you're signed in.");
    void navigate({ to: "/" });
  };

  const google = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    setBusy(false);
    if (result.error) {
      toast.error("Google sign-in failed. Please try again.");
      return;
    }
    if (result.redirected) return;
    void navigate({ to: "/" });
  };

  return (
    <SiteLayout>
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:items-center">
        <section className="hidden lg:block">
          <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-xs font-medium text-secondary-foreground">
            <ShoppingBag className="size-3.5" /> {brand.name} accounts
          </span>
          <h1 className="mt-5 font-display text-4xl font-semibold leading-tight">
            One account for buying and selling across Nepal.
          </h1>
          <p className="mt-4 max-w-md text-muted-foreground">{brand.shortDescription}</p>
          <ul className="mt-8 space-y-3 text-sm text-muted-foreground">
            <li>· Track every order from all seven provinces in one place</li>
            <li>· Save your cart across devices</li>
            <li>· Apply to become a verified seller in minutes</li>
          </ul>
        </section>

        <div className="mx-auto w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-elevated">
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form className="mt-6 space-y-4" onSubmit={signIn}>
                <Field id="signin-email" name="email" label="Email" type="email" icon={Mail} />
                <Field
                  id="signin-password"
                  name="password"
                  label="Password"
                  type="password"
                  icon={Lock}
                />
                <Button type="submit" className="w-full rounded-full" disabled={busy}>
                  {busy && <Loader2 className="mr-2 size-4 animate-spin" />} Sign in
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form className="mt-6 space-y-4" onSubmit={signUp}>
                <Field
                  id="signup-name"
                  name="full_name"
                  label="Full name"
                  type="text"
                  icon={UserIcon}
                />
                <Field id="signup-email" name="email" label="Email" type="email" icon={Mail} />
                <Field
                  id="signup-password"
                  name="password"
                  label="Password"
                  type="password"
                  icon={Lock}
                  minLength={6}
                />
                <Button type="submit" className="w-full rounded-full" disabled={busy}>
                  {busy && <Loader2 className="mr-2 size-4 animate-spin" />} Create account
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or continue with{" "}
            <span className="h-px flex-1 bg-border" />
          </div>

          <Button
            variant="outline"
            className="w-full rounded-full"
            disabled={busy}
            onClick={() => void google()}
          >
            <GoogleIcon /> Continue with Google
          </Button>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Want to sell on {brand.name}?{" "}
            <Link to="/become-seller" className="font-medium text-primary hover:underline">
              Apply as a seller
            </Link>
          </p>
        </div>
      </div>
    </SiteLayout>
  );
}

function Field({
  id,
  name,
  label,
  type,
  icon: Icon,
  minLength,
}: {
  id: string;
  name: string;
  label: string;
  type: string;
  icon: React.ComponentType<{ className?: string }>;
  minLength?: number;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative mt-2">
        <Icon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          name={name}
          type={type}
          required
          minLength={minLength ?? undefined}
          autoComplete={type === "password" ? "current-password" : "on"}
          className="pl-9"
        />
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="mr-2 size-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.9Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0 0 12 24Z"
      />
      <path fill="#FBBC05" d="M5.4 14.4a7.2 7.2 0 0 1 0-4.6V6.7H1.4a12 12 0 0 0 0 10.8l4-3.1Z" />
      <path
        fill="#EA4335"
        d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4C17.9 1.2 15.2 0 12 0 7.4 0 3.4 2.6 1.4 6.7l4 3.1C6.3 6.9 8.9 4.8 12 4.8Z"
      />
    </svg>
  );
}
