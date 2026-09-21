import { createRemoteJWKSet, jwtVerify } from "npm:jose@6.1.0";
import { adminClient } from "../_shared/supabase.ts";
import { decryptVerifier, sha256 } from "../_shared/identity-session.ts";

const redirect = (outcome: string, vendor = false) => {
  const configured = Deno.env.get("WEB_URL");
  if (!configured)
    return new Response("Identity callback is not configured.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  const destination = new URL(vendor ? "/vendor/workspace" : "/account/verification", configured);
  destination.searchParams.set("identity_verification", outcome);
  return Response.redirect(destination, 303);
};

Deno.serve(async (request) => {
  const callback = new URL(request.url);
  const state = callback.searchParams.get("state");
  const code = callback.searchParams.get("code");
  if (!state || !code || callback.searchParams.has("error")) return redirect("failed");

  const admin = adminClient();
  const { data: session } = await admin
    .from("vendor_identity_sessions")
    .select("*")
    .eq("state_hash", await sha256(state))
    .eq("status", "pending")
    .maybeSingle();
  if (!session) return redirect("expired");
  if (new Date(session.expires_at).getTime() <= Date.now()) {
    await admin.from("vendor_identity_sessions").update({ status: "expired" }).eq("id", session.id);
    return redirect("expired");
  }

  const { data: claimed } = await admin
    .from("vendor_identity_sessions")
    .update({ status: "processing", updated_at: new Date().toISOString() })
    .eq("id", session.id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();
  if (!claimed) return redirect("expired");

  try {
    const verifier = await decryptVerifier(session.verifier_ciphertext, session.verifier_iv);
    const tokenResponse = await fetch(Deno.env.get("NINAUTH_TOKEN_URL")!, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "client-id": Deno.env.get("NINAUTH_CLIENT_ID")!,
        "client-secret": Deno.env.get("NINAUTH_CLIENT_SECRET")!,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        code_verifier: verifier,
        client_id: Deno.env.get("NINAUTH_CLIENT_ID")!,
        app_id: Deno.env.get("NINAUTH_APP_ID")!,
        redirect_uri: Deno.env.get("NINAUTH_REDIRECT_URI")!,
        state,
      }),
    });
    if (!tokenResponse.ok) throw new Error("token_exchange_failed");
    const tokens = await tokenResponse.json();
    if (typeof tokens.id_token !== "string") throw new Error("id_token_missing");

    const verified = await jwtVerify(
      tokens.id_token,
      createRemoteJWKSet(new URL(Deno.env.get("NINAUTH_JWKS_URL")!)),
      {
        issuer: Deno.env.get("NINAUTH_ISSUER")!,
        audience: Deno.env.get("NINAUTH_CLIENT_ID")!,
      },
    );
    const requestId = String(
      verified.payload.transaction_id ?? verified.payload.jti ?? crypto.randomUUID(),
    );
    if (
      typeof verified.payload.nonce !== "string" ||
      (await sha256(verified.payload.nonce)) !== session.nonce_hash
    )
      throw new Error("nonce_mismatch");
    const now = new Date().toISOString();
    if (session.application_id) {
      const { error: checkError } = await admin.from("vendor_provider_checks").upsert(
        {
          application_id: session.application_id,
          kind: "identity",
          provider: "ninauth",
          provider_request_id: requestId,
          status: "passed",
          result_summary: {
            outcome: "passed",
            assurance: "ninauth_oidc",
            claims_verified: true,
          },
          consent_version: session.consent_version,
          consented_at: session.created_at,
          updated_at: now,
        },
        { onConflict: "application_id,kind" },
      );
      if (checkError) throw new Error("result_persistence_failed");
    }
    const { data: currentAccount } = await admin
      .from("account_identity_verifications")
      .select(
        "document_verified_at,selfie_liveness_verified_at,face_match_verified_at,checked_at,expires_at",
      )
      .eq("user_id", session.subject_user_id)
      .maybeSingle();
    const proofingPassed = Boolean(
      currentAccount?.document_verified_at &&
        currentAccount?.selfie_liveness_verified_at &&
        currentAccount?.face_match_verified_at &&
        currentAccount?.expires_at &&
        new Date(currentAccount.expires_at).getTime() > Date.now(),
    );
    const { error: accountError } = await admin.from("account_identity_verifications").upsert({
      user_id: session.subject_user_id,
      status: proofingPassed ? "verified" : "in_progress",
      national_identity_verified_at: now,
      national_identity_expires_at: new Date(Date.now() + 365 * 86400000).toISOString(),
      checked_at: currentAccount?.checked_at ?? now,
      expires_at: currentAccount?.expires_at ?? new Date(Date.now() + 365 * 86400000).toISOString(),
      updated_at: now,
    });
    if (accountError) throw new Error("account_result_persistence_failed");
    await admin
      .from("vendor_identity_sessions")
      .update({
        status: "completed",
        provider_request_id: requestId,
        consumed_at: now,
        updated_at: now,
      })
      .eq("id", session.id)
      .eq("status", "processing");
    return redirect("completed", Boolean(session.application_id));
  } catch (error) {
    const failureCode = error instanceof Error ? error.message.slice(0, 80) : "provider_failure";
    await admin
      .from("vendor_identity_sessions")
      .update({
        status: "failed",
        failure_code: failureCode,
        consumed_at: new Date().toISOString(),
      })
      .eq("id", session.id)
      .eq("status", "processing");
    return redirect("failed", Boolean(session.application_id));
  }
});
