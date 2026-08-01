import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Lock, Mail, ShieldAlert, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Choose a new password — Nepalium" },
      {
        name: "description",
        content: "Verify your reset link and set a new password for your Nepalium account.",
      },
      { property: "og:title", content: "Choose a new password — Nepalium" },
      { property: "og:description", content: "Set a new Nepalium account password." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResetPasswordPage,
});

type Phase = "verifying" | "verified" | "invalid";

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [phase, setPhase] = useState<Phase>("verifying");
  const [reason, setReason] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [resending, setResending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const finish = (ok: boolean, message?: string | null, userEmail?: string | null) => {
      if (cancelled) return;
      if (userEmail) setEmail(userEmail);
      setPhase(ok ? "verified" : "invalid");
      if (!ok) setReason(message ?? "This reset link is invalid or has expired.");
    };

    const verify = async () => {
      const url = new URL(window.location.href);
      const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
      const params = url.searchParams;

      const linkError = hash.get("error_description") ?? params.get("error_description");
      if (linkError) return finish(false, linkError);

      // 1) Token-hash link: ?token_hash=...&type=recovery
      const tokenHash = params.get("token_hash") ?? params.get("token");
      const type = params.get("type");
      if (tokenHash && (!type || type === "recovery")) {
        const { data, error } = await supabase.auth.verifyOtp({
          type: "recovery",
          token_hash: tokenHash,
        });
        window.history.replaceState({}, "", url.pathname);
        return finish(!error, error?.message, data?.user?.email);
      }

      // 2) PKCE link: ?code=...
      const code = params.get("code");
      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        window.history.replaceState({}, "", url.pathname);
        return finish(!error, error?.message, data?.user?.email);
      }

      // 3) Implicit link (#access_token=...): the client parses the hash and emits
      // PASSWORD_RECOVERY. Fall back to an existing recovery session.
      const { data } = await supabase.auth.getSession();
      if (data.session) return finish(true, null, data.session.user.email);

      window.setTimeout(async () => {
        const { data: late } = await supabase.auth.getSession();
        finish(Boolean(late.session), null, late.session?.user.email ?? null);
      }, 1500);
    };

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        finish(true, null, session?.user.email ?? null);
      }
    });

    void verify();
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (phase !== "verified") return;
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password"));
    if (password !== String(form.get("confirm"))) {
      toast.error("Passwords don't match.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password updated — you're signed in.");
    void navigate({ to: "/" });
  };

  const resend = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const address = String(new FormData(e.currentTarget).get("email")).trim();
    if (!address) return;
    setResending(true);
    const { error } = await supabase.auth.resetPasswordForEmail(address, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setResending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("New reset link sent — check your inbox.");
  };

  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-md px-4 py-16 sm:px-6">
        <div className="rounded-3xl border border-border bg-card p-8 shadow-elevated">
          {phase === "verifying" && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <Loader2 className="size-8 animate-spin text-primary" />
              <h1 className="font-display text-2xl font-semibold">Verifying your reset link</h1>
              <p className="text-sm text-muted-foreground">
                Hang tight while we confirm this link is genuine and still valid.
              </p>
            </div>
          )}

          {phase === "invalid" && (
            <div className="space-y-5">
              <div className="flex flex-col items-center gap-3 text-center">
                <ShieldAlert className="size-8 text-destructive" />
                <h1 className="font-display text-2xl font-semibold">Reset link not valid</h1>
                <p className="text-sm text-muted-foreground">{reason}</p>
              </div>
              <form className="space-y-3" onSubmit={resend}>
                <Label htmlFor="email">Send a fresh link</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    className="pl-9"
                  />
                </div>
                <Button type="submit" className="w-full rounded-full" disabled={resending}>
                  {resending && <Loader2 className="mr-2 size-4 animate-spin" />} Email me a new link
                </Button>
              </form>
              <p className="text-center text-sm text-muted-foreground">
                <Link to="/auth" className="font-medium text-primary hover:underline">
                  Back to sign in
                </Link>
              </p>
            </div>
          )}

          {phase === "verified" && (
            <>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                <ShieldCheck className="size-4" /> Reset link verified
                {email ? <span className="truncate text-primary/80">· {email}</span> : null}
              </div>
              <h1 className="mt-4 font-display text-2xl font-semibold">Choose a new password</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Enter a new password for your account. Minimum 6 characters.
              </p>

              <form className="mt-6 space-y-4" onSubmit={submit}>
                <div>
                  <Label htmlFor="password">New password</Label>
                  <div className="relative mt-2">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      required
                      minLength={6}
                      autoComplete="new-password"
                      className="pl-9"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="confirm">Confirm new password</Label>
                  <div className="relative mt-2">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="confirm"
                      name="confirm"
                      type="password"
                      required
                      minLength={6}
                      autoComplete="new-password"
                      className="pl-9"
                    />
                  </div>
                </div>
                <Button type="submit" className="w-full rounded-full" disabled={busy}>
                  {busy ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 size-4" />
                  )}
                  Update password
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </SiteLayout>
  );
}
