import { z } from "npm:zod@3.25.76";
import { corsHeaders } from "../_shared/cors.ts";
import { failure, success } from "../_shared/api.ts";
import { adminClient, userClient } from "../_shared/supabase.ts";

const Input = z
  .object({
    applicationId: z.string().uuid(),
    kind: z.enum(["identity", "bank_name"]),
    providerToken: z.string().min(8).max(200),
    consentVersion: z.string().min(1).max(40),
  })
  .strict();
Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const auth = request.headers.get("Authorization") ?? "";
  const client = userClient(auth);
  const { data: authData } = await client.auth.getUser();
  if (!authData.user) return failure("UNAUTHORIZED", 401);
  const parsed = Input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return failure("INVALID_REQUEST", 400);
  const { data: application } = await client
    .from("vendor_applications")
    .select("id")
    .eq("id", parsed.data.applicationId)
    .maybeSingle();
  if (!application) return failure("NOT_FOUND", 404);
  const sandbox = Deno.env.get("MMEMME_ENV") !== "production";
  const providerUrl = Deno.env.get("VERIFICATION_PROVIDER_URL");
  if (!sandbox && !providerUrl) return failure("PROVIDER_UNAVAILABLE", 503);
  const token = parsed.data.providerToken;
  let status: "passed" | "failed" | "manual_review" | "unavailable";
  let providerRequestId = crypto.randomUUID();
  let resultSummary: Record<string, unknown>;
  if (sandbox) {
    status = token.startsWith("pass_")
      ? "passed"
      : token.startsWith("fail_")
        ? "failed"
        : token.startsWith("review_")
          ? "manual_review"
          : "unavailable";
    resultSummary = { outcome: status, match: status === "passed" };
  } else {
    try {
      const response = await fetch(providerUrl!, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Deno.env.get("VERIFICATION_PROVIDER_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, kind: parsed.data.kind }),
      });
      if (!response.ok) return failure("PROVIDER_UNAVAILABLE", 503);
      const result = await response.json();
      status = ["passed", "failed", "manual_review"].includes(result.status)
        ? result.status
        : "manual_review";
      providerRequestId = String(result.requestId);
      resultSummary = { outcome: status, match: result.match === true };
    } catch {
      return failure("PROVIDER_UNAVAILABLE", 503);
    }
  }
  const { data, error } = await adminClient()
    .from("vendor_provider_checks")
    .upsert(
      {
        application_id: application.id,
        kind: parsed.data.kind,
        provider: sandbox ? "mmemme-sandbox" : "configured-provider",
        provider_request_id: providerRequestId,
        status,
        result_summary: resultSummary,
        consent_version: parsed.data.consentVersion,
        consented_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "application_id,kind" },
    )
    .select("id,status,provider_request_id")
    .single();
  if (error) return failure("INTERNAL_ERROR", 500);
  return success(data);
});
