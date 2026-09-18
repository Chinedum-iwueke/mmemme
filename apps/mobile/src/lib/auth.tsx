import type { Session, User } from "@supabase/supabase-js";
import { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";
import { isSupabaseConfigured, supabase } from "./supabase";
import type { ProfileRow } from "./database.types";

export type VendorMembership = {
  account_id: string;
  role: "owner" | "manager" | "editor" | "viewer";
};

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: ProfileRow | null;
  vendorMembership: VendorMembership | null;
  loading: boolean;
  configured: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [vendorMembership, setVendorMembership] = useState<VendorMembership | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) {
      setProfile(null);
      setVendorMembership(null);
      return;
    }
    const [{ data: profileData }, { data: membershipData }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id,full_name,phone,email,is_admin")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("vendor_memberships")
        .select("account_id,role")
        .eq("user_id", user.id)
        .order("created_at")
        .limit(1)
        .maybeSingle(),
    ]);
    setProfile(profileData as ProfileRow | null);
    setVendorMembership(membershipData as VendorMembership | null);
  };

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session) await refreshProfile();
      setLoading(false);
    });
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (next) setTimeout(refreshProfile, 0);
      else {
        setProfile(null);
        setVendorMembership(null);
      }
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      vendorMembership,
      loading,
      configured: isSupabaseConfigured,
      refreshProfile,
      signOut: async () => {
        if (session?.user)
          await supabase
            .from("push_tokens")
            .update({ active: false, updated_at: new Date().toISOString() })
            .eq("customer_id", session.user.id);
        await supabase.auth.signOut();
      },
    }),
    [session, profile, vendorMembership, loading],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
};
