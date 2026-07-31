import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2, Store, TrendingUp, Wallet, Users } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PROVINCES, districtsOf } from "@/lib/nepal";

export const Route = createFileRoute("/become-seller")({
  head: () => ({
    meta: [
      { title: "Become a seller on Nepalium" },
      {
        name: "description",
        content:
          "Apply to sell on Nepalium. Reach customers in all 77 districts of Nepal with a verified seller store.",
      },
      { property: "og:title", content: "Become a seller on Nepalium" },
      {
        property: "og:description",
        content: "Apply for a verified seller store and reach buyers across Nepal.",
      },
    ],
  }),
  component: BecomeSellerPage,
});

function BecomeSellerPage() {
  const { user, isSeller, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [province, setProvince] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const application = useQuery({
    queryKey: ["seller-application", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seller_applications")
        .select("id,status,store_name,created_at,rejection_reason")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    const form = new FormData(e.currentTarget);
    setBusy(true);
    const { error } = await supabase.from("seller_applications").insert({
      user_id: user.id,
      store_name: String(form.get("store_name")),
      description: String(form.get("description")),
      province: String(form.get("province")),
      district: String(form.get("district")),
      phone: String(form.get("phone")),
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Application submitted — our team reviews within 48 hours.");
    void queryClient.invalidateQueries({ queryKey: ["seller-application"] });
  };

  return (
    <SiteLayout>
      <section className="bg-gradient-hero">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <h1 className="max-w-2xl font-display text-4xl font-semibold text-primary-foreground sm:text-5xl">
            Sell to every district in Nepal.
          </h1>
          <p className="mt-4 max-w-xl text-primary-foreground/85">
            Open a verified store, list your products and let Nepalium handle discovery, payments
            and delivery logistics.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Users, label: "Buyers reached", value: "120k+" },
              { icon: TrendingUp, label: "Avg. growth", value: "38% / yr" },
              { icon: Wallet, label: "Commission", value: "From 4%" },
              { icon: Store, label: "Active stores", value: "2,400+" },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl bg-card/95 p-5 shadow-soft backdrop-blur">
                <s.icon className="size-5 text-primary" />
                <p className="mt-3 font-display text-2xl font-semibold">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto w-full max-w-3xl px-4 py-14 sm:px-6">
        {loading ? null : !user ? (
          <div className="rounded-3xl border border-border bg-card p-10 text-center shadow-soft">
            <h2 className="font-display text-2xl font-semibold">Sign in to apply</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              You need a Nepalium account before submitting a seller application.
            </p>
            <Button asChild className="mt-6 rounded-full">
              <Link to="/auth">Sign in or create an account</Link>
            </Button>
          </div>
        ) : isSeller ? (
          <div className="rounded-3xl border border-border bg-card p-10 text-center shadow-soft">
            <h2 className="font-display text-2xl font-semibold">You're already a seller</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Manage your store, products and stock from the seller dashboard.
            </p>
            <Button className="mt-6 rounded-full" onClick={() => void navigate({ to: "/seller" })}>
              Go to seller dashboard
            </Button>
          </div>
        ) : application.data ? (
          <div className="rounded-3xl border border-border bg-card p-10 shadow-soft">
            <Badge
              variant={application.data.status === "rejected" ? "destructive" : "secondary"}
              className="capitalize"
            >
              {application.data.status}
            </Badge>
            <h2 className="mt-4 font-display text-2xl font-semibold">
              Application for “{application.data.store_name}”
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {application.data.status === "pending"
                ? "Our team is reviewing your store. Approval usually takes under 48 hours."
                : application.data.status === "approved"
                  ? "Approved! Your seller dashboard is unlocked."
                  : "This application was not approved."}
            </p>
            {application.data.rejection_reason && (
              <p className="mt-4 rounded-xl bg-muted p-4 text-sm">{application.data.rejection_reason}</p>
            )}
          </div>
        ) : (
          <form
            onSubmit={submit}
            className="space-y-5 rounded-3xl border border-border bg-card p-8 shadow-soft"
          >
            <div>
              <h2 className="font-display text-2xl font-semibold">Seller application</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Tell us about your business. Admins review every store before it goes live.
              </p>
            </div>

            <div>
              <Label htmlFor="store_name">Store name</Label>
              <Input id="store_name" name="store_name" required className="mt-2" />
            </div>

            <div>
              <Label htmlFor="description">What do you sell?</Label>
              <Textarea id="description" name="description" required rows={4} className="mt-2" />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="province">Province</Label>
                <Select name="province" required onValueChange={setProvince}>
                  <SelectTrigger id="province" className="mt-2">
                    <SelectValue placeholder="Select province" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVINCES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="district">District</Label>
                <Select name="district" required>
                  <SelectTrigger id="district" className="mt-2">
                    <SelectValue placeholder="Select district" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {districtsOf(province).map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="phone">Contact phone</Label>
              <Input id="phone" name="phone" type="tel" required className="mt-2" />
            </div>

            <Button type="submit" size="lg" className="w-full rounded-full" disabled={busy}>
              {busy && <Loader2 className="mr-2 size-4 animate-spin" />} Submit application
            </Button>
          </form>
        )}
      </div>
    </SiteLayout>
  );
}
