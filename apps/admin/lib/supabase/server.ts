import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function createClient() {
  const store = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: { getAll: () => store.getAll(), setAll: (values) => { try { values.forEach(({name,value,options})=>store.set(name,value,options as CookieOptions)); } catch {} } },
  });
}
export const createAdminClient = () => createServiceClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession:false, autoRefreshToken:false } });

export async function requireAdmin() {
  const client = await createClient(); const { data:{ user } } = await client.auth.getUser();
  if (!user) redirect("/login");
  const { data: profile } = await client.from("profiles").select("is_admin").eq("id",user.id).single();
  if (!profile?.is_admin) redirect("/login?error=not-authorized");
  const { data: assurance } = await client.auth.mfa.getAuthenticatorAssuranceLevel();
  if (process.env.ADMIN_REQUIRE_AAL2 !== "false" && assurance?.currentLevel !== "aal2") redirect("/login?error=mfa-required");
  return user;
}
