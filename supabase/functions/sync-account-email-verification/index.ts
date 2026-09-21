import { corsHeaders } from "../_shared/cors.ts";
import { failure, success } from "../_shared/api.ts";
import { adminClient, userClient } from "../_shared/supabase.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return failure("INVALID_REQUEST", 405);
  const client = userClient(request.headers.get("Authorization") ?? "");
  const { data } = await client.auth.getUser();
  if (!data.user) return failure("UNAUTHORIZED", 401);
  const verifiedAt = data.user.email_confirmed_at ?? null;
  const { error } = await adminClient().from("account_identity_verifications").upsert({
    user_id: data.user.id,
    email_verified_at: verifiedAt,
    updated_at: new Date().toISOString(),
  });
  if (error) return failure("INTERNAL_ERROR", 500);
  return success({ emailVerified: Boolean(verifiedAt), verifiedAt });
});
