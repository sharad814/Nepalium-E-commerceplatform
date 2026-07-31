import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Loader2, LogOut, ShieldCheck, Store } from "lucide-react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Your account — Nepalium" },
      {
        name: "description",
        content: "Manage your Nepalium profile, delivery location and account settings.",
      },
      { property: "og:title", content: "Your account — Nepalium" },
      { property: "og:description", content: "Manage your Nepalium profile and settings." },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const { user, roles, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const profile = useQuery({
    queryKey: ["profile", user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id,full_name,phone,province,district")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (profile.data) {
      setProvince(profile.data.province ?? "");
      setDistrict(profile.data.district ?? "");
    }
  }, [profile.data]);

  const save = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    const form = new FormData(e.currentTarget);
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: String(form.get("full_name")),
        phone: String(form.get("phone")),
        province: province || null,
        district: district || null,
      })
      .eq("id", user.id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Profile updated");
    void queryClient.invalidateQueries({ queryKey: ["profile"] });
  };

  if (!user) return null;

  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-semibold">Your account</h1>
            <p className="mt-1 text-sm text-muted-foreground">{user.email}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {roles.map((r) => (
              <Badge key={r} variant="secondary" className="capitalize">
                <ShieldCheck className="mr-1 size-3" /> {r}
              </Badge>
            ))}
          </div>
        </header>

        <form
          onSubmit={save}
          className="mt-8 space-y-5 rounded-3xl border border-border bg-card p-8 shadow-soft"
        >
          <h2 className="font-display text-xl font-semibold">Profile details</h2>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="full_name">Full name</Label>
              <Input
                id="full_name"
                name="full_name"
                defaultValue={profile.data?.full_name ?? ""}
                key={profile.data?.full_name ?? "name"}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                defaultValue={profile.data?.phone ?? ""}
                key={profile.data?.phone ?? "phone"}
                className="mt-2"
              />
            </div>
            <div>
              <Label>Province</Label>
              <Select
                value={province}
                onValueChange={(v) => {
                  setProvince(v);
                  setDistrict("");
                }}
              >
                <SelectTrigger className="mt-2">
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
              <Label>District</Label>
              <Select value={district} onValueChange={setDistrict}>
                <SelectTrigger className="mt-2">
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

          <Button type="submit" className="rounded-full" disabled={busy}>
            {busy && <Loader2 className="mr-2 size-4 animate-spin" />} Save changes
          </Button>
        </form>

        <div className="mt-8 rounded-3xl border border-border bg-card p-8 shadow-soft">
          <h2 className="font-display text-xl font-semibold">Selling on Nepalium</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {roles.includes("seller")
              ? "Your seller store is active. Manage products and stock from the dashboard."
              : "Open a verified store and start selling to buyers across all seven provinces."}
          </p>
          <Button asChild variant="outline" className="mt-5 rounded-full">
            <Link to={roles.includes("seller") ? "/seller" : "/become-seller"}>
              <Store className="mr-2 size-4" />
              {roles.includes("seller") ? "Seller dashboard" : "Become a seller"}
            </Link>
          </Button>
        </div>

        <Separator className="my-8" />

        <Button
          variant="outline"
          className="rounded-full"
          onClick={() => {
            void signOut();
            void navigate({ to: "/" });
          }}
        >
          <LogOut className="mr-2 size-4" /> Sign out
        </Button>
      </div>
    </SiteLayout>
  );
}
