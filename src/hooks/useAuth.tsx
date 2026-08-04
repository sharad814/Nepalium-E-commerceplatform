import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "seller" | "customer";

export type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
};

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  roles: AppRole[];
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  isSeller: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Register the listener first, then hydrate the existing session.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (!next) {
        setRoles([]);
        setProfile(null);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const user = session?.user;
    const userId = user?.id;
    if (!userId || !user) return;
    let alive = true;

    // Keep the database profile in sync with the identity provider (Google, email, …).
    void (async () => {
      const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
      const fullName =
        (meta['full_name'] as string) || (meta['name'] as string) || null;
      const avatarUrl =
        (meta['avatar_url'] as string) || (meta['picture'] as string) || null;

      const { data: existing } = await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url")
        .eq("id", userId)
        .maybeSingle();

      const next = {
        id: userId,
        full_name: fullName ?? existing?.full_name ?? null,
        email: user.email ?? existing?.email ?? null,
        avatar_url: avatarUrl ?? existing?.avatar_url ?? null,
      };

      const { data: saved } = await supabase
        .from("profiles")
        .upsert(next, { onConflict: "id" })
        .select("id, full_name, email, avatar_url")
        .maybeSingle();

      if (alive) setProfile((saved as Profile) ?? (next as Profile));
    })();

    return () => {
      alive = false;
    };
  }, [session?.user?.id]);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) return;
    let active = true;
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .then(({ data }) => {
        if (active) setRoles(((data ?? []) as { role: AppRole }[]).map((r) => r.role));
      });
    return () => {
      active = false;
    };
  }, [session?.user?.id]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      roles,
      profile,
      loading,
      isAdmin: roles.includes("admin"),
      isSeller: roles.includes("seller"),
      signOut: async () => {
        await supabase.auth.signOut();
      },
    }),
    [session, roles, profile, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
