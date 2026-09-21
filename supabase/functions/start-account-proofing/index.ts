import { z } from "npm:zod@3.25.76";
import { corsHeaders } from "../_shared/cors.ts";
import { failure, success } from "../_shared/api.ts";
import { adminClient, userClient } from "../_shared/supabase.ts";

const Input = z
  .object({
    consentAccepted: z.literal(true),
    consentVersion: z.literal("identity-proofing-2026-09"),
  })
  .strict();

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return failure("INVALID_REQUEST", 405);
  const client = userClient(request.headers.get("Authorization") ?? "");
  const { data: authData } = await client.auth.getUser();
  if (!authData.user) return failure("UNAUTHORIZED", 401);
  const parsed = Input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return failure("INVALID_REQUEST", 400);

  const providerUrl = Deno.env.get("IDENTITY_PROOFING_PROVIDER_URL");
  const providerKey = Deno.env.get("IDENTITY_PROOFING_PROVIDER_KEY");
  const callbackUrl = Deno.env.get("IDENTITY_PROOFING_CALLBACK_URL");
  const hostedOrigin = Deno.env.get("IDENTITY_PROOFING_HOSTED_ORIGIN");
  const webUrl = Deno.env.get("WEB_URL");
  if (!providerUrl || !providerKey || !callbackUrl || !hostedOrigin || !webUrl)
    return failure("PROVIDER_UNAVAILABLE", 503);

  const admin = adminClient();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 60 * 1000).toISOString();
  const { data: session, error: sessionError } = await admin
    .from("identity_proofing_sessions")
    .insert({
      user_id: authData.user.id,
      provider: "configured-proofing-provider",
      consent_version: parsed.data.consentVersion,
      consented_at: now.toISOString(),
      purpose:
        "Confirm identity-document authenticity, selfie liveness and face match for marketplace trust.",
      expires_at: expiresAt,
    })
    .select("id")
    .single();
  if (sessionError) return failure("INTERNAL_ERROR", 500);

  try {
    const providerResponse = await fetch(providerUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${providerKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        reference: session.id,
        callbackUrl,
        returnUrl: new URL("/account/verification?proofing=returned", webUrl).toString(),
        checks: ["document_authenticity", "selfie_liveness", "face_match"],
        dataRetention: "provider_minimum",
      }),
    });
    if (!providerResponse.ok) throw new Error("provider_start_failed");
    const result = await providerResponse.json();
    const parsedResult = z
      .object({
        sessionId: z.string().min(1).max(200),
        hostedUrl: z.string().url(),
      })
      .safeParse(result);
    if (!parsedResult.success) throw new Error("provider_contract_invalid");
    if (new URL(parsedResult.data.hostedUrl).origin !== new URL(hostedOrigin).origin)
      throw new Error("provider_redirect_origin_invalid");
    await admin
      .from("identity_proofing_sessions")
      .update({ provider_session_id: parsedResult.data.sessionId, status: "processing" })
      .eq("id", session.id);
    await admin.from("account_identity_verifications").upsert({
      user_id: authData.user.id,
      status: "in_progress",
      provider: "configured-proofing-provider",
      updated_at: now.toISOString(),
    });
    return success({ hostedUrl: parsedResult.data.hostedUrl, expiresAt });
  } catch {
    await admin
      .from("identity_proofing_sessions")
      .update({ status: "failed", completed_at: new Date().toISOString() })
      .eq("id", session.id);
    return failure("PROVIDER_UNAVAILABLE", 503);
  }
});
