import { adminClient } from "../_shared/supabase.ts";
import { redactedLog } from "../_shared/security.ts";

Deno.serve(async (request) => {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
  if (
    !Deno.env.get("CRON_SECRET") ||
    request.headers.get("x-cron-secret") !== Deno.env.get("CRON_SECRET")
  )
    return new Response("Unauthorized", { status: 401 });
  const correlationId = request.headers.get("x-correlation-id") ?? crypto.randomUUID();
  const { data, error } = await adminClient().rpc("apply_retention_schedule");
  if (error) {
    redactedLog("error", "security_maintenance.failed", { correlationId, errorCode: error.code });
    return Response.json({ error: "maintenance failed", correlationId }, { status: 500 });
  }
  redactedLog("info", "security_maintenance.completed", { correlationId, result: data });
  return Response.json({ correlationId, retention: data });
});
