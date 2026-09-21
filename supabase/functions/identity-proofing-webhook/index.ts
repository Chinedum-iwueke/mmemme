import { z } from "npm:zod@3.25.76";
import { adminClient } from "../_shared/supabase.ts";
import { sha256 } from "../_shared/identity-session.ts";

const Event = z
  .object({
    eventId: z.string().min(1).max(200),
    reference: z.string().uuid(),
    sessionId: z.string().min(1).max(200),
    status: z.enum(["passed", "failed", "manual_review"]),
    checks: z.object({
      documentAuthentic: z.boolean(),
      livenessPassed: z.boolean(),
      faceMatch: z.boolean(),
    }),
    confidenceBand: z.enum(["high", "medium", "low"]),
    completedAt: z.string().datetime(),
  })
  .strict();

const hex = (bytes: ArrayBuffer) =>
  [...new Uint8Array(bytes)].map((value) => value.toString(16).padStart(2, "0")).join("");
const secureEqual = (left: string, right: string) => {
  if (left.length !== right.length) return false;
  let result = 0;
  for (let index = 0; index < left.length; index++)
    result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return result === 0;
};

Deno.serve(async (request) => {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const secret = Deno.env.get("IDENTITY_PROOFING_WEBHOOK_SECRET");
  const signature = request.headers.get("x-mmemme-signature") ?? "";
  if (!secret || !signature) return new Response("Unauthorized", { status: 401 });
  const body = await request.text();
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const expected = hex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body)));
  if (!secureEqual(signature.toLowerCase(), expected))
    return new Response("Unauthorized", { status: 401 });
  let decoded: unknown;
  try {
    decoded = JSON.parse(body);
  } catch {
    return new Response("Invalid event", { status: 400 });
  }
  const event = Event.safeParse(decoded);
  if (!event.success) return new Response("Invalid event", { status: 400 });

  const admin = adminClient();
  const { data: session } = await admin
    .from("identity_proofing_sessions")
    .select("id,user_id,status,provider_session_id")
    .eq("id", event.data.reference)
    .eq("provider_session_id", event.data.sessionId)
    .maybeSingle();
  if (!session) return new Response("Unknown session", { status: 404 });
  const payloadHash = await sha256(body);
  const { error: eventError } = await admin.from("identity_proofing_events").insert({
    provider: "configured-proofing-provider",
    provider_event_id: event.data.eventId,
    session_id: session.id,
    payload_sha256: payloadHash,
  });
  if (eventError?.code === "23505") {
    const { data: recorded } = await admin
      .from("identity_proofing_events")
      .select("payload_sha256")
      .eq("provider", "configured-proofing-provider")
      .eq("provider_event_id", event.data.eventId)
      .maybeSingle();
    if (recorded?.payload_sha256 !== payloadHash)
      return new Response("Event identifier conflict", { status: 409 });
  } else if (eventError) return new Response("Retry", { status: 503 });

  const checksPassed =
    event.data.status === "passed" &&
    event.data.checks.documentAuthentic &&
    event.data.checks.livenessPassed &&
    event.data.checks.faceMatch;
  const outcome =
    event.data.status === "manual_review" ||
    (event.data.status === "passed" && event.data.confidenceBand === "low")
      ? "manual_review"
      : checksPassed
        ? "passed"
        : "failed";
  const { data: transitioned, error: transitionError } = await admin
    .from("identity_proofing_sessions")
    .update({
      status: outcome,
      completed_at: event.data.completedAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", session.id)
    .in("status", ["pending", "processing"])
    .select("id")
    .maybeSingle();
  if (transitionError) return new Response("Retry", { status: 503 });
  // A duplicate or reordered event may be authentic but must not overwrite a
  // result that already reached a terminal state.
  if (!transitioned) return new Response("ok");

  const { data: current } = await admin
    .from("account_identity_verifications")
    .select("national_identity_verified_at,national_identity_expires_at")
    .eq("user_id", session.user_id)
    .maybeSingle();
  const verified =
    outcome === "passed" &&
    Boolean(
      current?.national_identity_verified_at &&
        current?.national_identity_expires_at &&
        new Date(current.national_identity_expires_at).getTime() > Date.now(),
    );
  await admin.from("account_identity_verifications").upsert({
    user_id: session.user_id,
    status: verified
      ? "verified"
      : outcome === "manual_review"
        ? "manual_review"
        : checksPassed
          ? "in_progress"
          : "failed",
    document_verified_at: event.data.checks.documentAuthentic ? event.data.completedAt : null,
    selfie_liveness_verified_at: event.data.checks.livenessPassed ? event.data.completedAt : null,
    face_match_verified_at: event.data.checks.faceMatch ? event.data.completedAt : null,
    provider: "configured-proofing-provider",
    provider_reference: event.data.sessionId,
    confidence_band: event.data.confidenceBand,
    checked_at: event.data.completedAt,
    expires_at: new Date(new Date(event.data.completedAt).getTime() + 365 * 86400000).toISOString(),
    failure_reason: checksPassed ? null : "provider_check_not_passed",
    updated_at: new Date().toISOString(),
  });
  return new Response("ok");
});
