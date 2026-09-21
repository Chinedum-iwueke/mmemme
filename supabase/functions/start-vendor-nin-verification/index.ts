import { z } from "npm:zod@3.25.76";
import { corsHeaders } from "../_shared/cors.ts";
import { failure, success } from "../_shared/api.ts";
import { adminClient, userClient } from "../_shared/supabase.ts";
import { encryptVerifier, randomUrlToken, sha256 } from "../_shared/identity-session.ts";

const Input = z
  .object({
    applicationId: z.string().uuid().optional(),
    consentVersion: z.literal("nin-verification-2026-09"),
    consentAccepted: z.literal(true),
  })
  .strict();

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return failure("INVALID_REQUEST", 405);

  const authorization = request.headers.get("Authorization") ?? "";
  const client = userClient(authorization);
  const { data: authData } = await client.auth.getUser();
  if (!authData.user) return failure("UNAUTHORIZED", 401);
  const parsed = Input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return failure("INVALID_REQUEST", 400);

  const { data: application } = parsed.data.applicationId
    ? await client
        .from("vendor_applications")
        .select("id")
        .eq("id", parsed.data.applicationId)
        .maybeSingle()
    : { data: null };
  if (parsed.data.applicationId && !application) return failure("NOT_FOUND", 404);

  const required = [
    "NINAUTH_AUTHORIZATION_URL",
    "NINAUTH_CLIENT_ID",
    "NINAUTH_APP_ID",
    "NINAUTH_REDIRECT_URI",
    "NINAUTH_SESSION_ENCRYPTION_KEY",
  ] as const;
  if (required.some((key) => !Deno.env.get(key))) return failure("PROVIDER_UNAVAILABLE", 503);

  const state = randomUrlToken();
  const nonce = randomUrlToken();
  const verifier = randomUrlToken(48);
  const challenge = await sha256(verifier);
  const encrypted = await encryptVerifier(verifier);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const consentPurpose = application
    ? "Confirm the vendor owner or director has a valid Nigerian identity for MMEMME marketplace verification."
    : "Confirm the account holder has a valid Nigerian identity for optional MMEMME marketplace trust verification.";

  const { error } = await adminClient()
    .from("vendor_identity_sessions")
    .insert({
      application_id: application?.id ?? null,
      subject_user_id: authData.user.id,
      requested_by: authData.user.id,
      state_hash: await sha256(state),
      nonce_hash: await sha256(nonce),
      verifier_ciphertext: encrypted.ciphertext,
      verifier_iv: encrypted.iv,
      consent_version: parsed.data.consentVersion,
      consent_purpose: consentPurpose,
      expires_at: expiresAt,
    });
  if (error) return failure("INTERNAL_ERROR", 500);

  const url = new URL(Deno.env.get("NINAUTH_AUTHORIZATION_URL")!);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", Deno.env.get("NINAUTH_CLIENT_ID")!);
  url.searchParams.set("app_id", Deno.env.get("NINAUTH_APP_ID")!);
  url.searchParams.set("redirect_uri", Deno.env.get("NINAUTH_REDIRECT_URI")!);
  url.searchParams.set("scope", Deno.env.get("NINAUTH_SCOPES") ?? "openid");
  url.searchParams.set("state", state);
  url.searchParams.set("nonce", nonce);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");

  return success({ authorizationUrl: url.toString(), expiresAt });
});
