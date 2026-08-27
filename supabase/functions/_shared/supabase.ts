import { createClient } from "jsr:@supabase/supabase-js@2";
import type { Database } from "./database.generated.ts";

export const adminClient = () => createClient<Database>(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

export const userClient = (authorization: string) => createClient<Database>(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_ANON_KEY")!,
  { global: { headers: { Authorization: authorization } }, auth: { persistSession: false } },
);
