import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Database } from "@mmemme/database";

export async function createClient() {
  const store = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll: (values) => {
          try {
            values.forEach(({ name, value, options }) =>
              store.set(name, value, options as CookieOptions),
            );
          } catch {}
        },
      },
    },
  );
}
export const createAdminClient = () =>
  createServiceClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

export type AdminCapability =
  "dashboard" | "bookings" | "vendors" | "support" | "money" | "audit" | "export";
const capabilities: Record<string, AdminCapability[]> = {
  owner: ["dashboard", "bookings", "vendors", "support", "money", "audit", "export"],
  operations: ["dashboard", "bookings", "vendors", "support", "audit", "export"],
  verification: ["dashboard", "vendors", "audit", "export"],
  support: ["dashboard", "bookings", "support", "audit", "export"],
  finance: ["dashboard", "money", "support", "audit", "export"],
  auditor: ["dashboard", "audit", "export"],
};

export async function requireAdmin(capability: AdminCapability = "dashboard") {
  const client = await createClient();
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) redirect("/login");
  const authenticatedUser = user!;
  const { data: access } = await createAdminClient()
    .from("admin_access")
    .select("role,active,last_seen_at,session_timeout_minutes,revoked_at")
    .eq("user_id", authenticatedUser.id)
    .maybeSingle();
  if (!access?.active || access.revoked_at || !capabilities[access.role]?.includes(capability))
    redirect("/login?error=not-authorized");
  if (
    access.last_seen_at &&
    Date.now() - new Date(access.last_seen_at).getTime() > access.session_timeout_minutes * 60_000
  ) {
    await client.auth.signOut();
    redirect("/login?error=session-expired");
  }
  const { data: assurance } = await client.auth.mfa.getAuthenticatorAssuranceLevel();
  const allowAal1 =
    process.env.ADMIN_REQUIRE_AAL2 === "false" &&
    ["local", "test"].includes(process.env.MMEMME_ENV ?? "");
  if (!allowAal1 && assurance?.currentLevel !== "aal2") redirect("/login?error=mfa-required");
  await client.rpc("touch_admin_session");
  return Object.assign(authenticatedUser, { adminRole: access.role });
}
