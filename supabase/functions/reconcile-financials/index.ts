import { adminClient } from "../_shared/supabase.ts";

Deno.serve(async (request) => {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
  if (
    !Deno.env.get("CRON_SECRET") ||
    request.headers.get("x-cron-secret") !== Deno.env.get("CRON_SECRET")
  )
    return new Response("Unauthorized", { status: 401 });
  const date =
    new URL(request.url).searchParams.get("date") ?? new Date().toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return new Response("Invalid date", { status: 400 });
  const { data, error } = await adminClient().rpc("run_financial_reconciliation", {
    p_run_date: date,
  });
  return error
    ? Response.json({ error: "reconciliation failed" }, { status: 500 })
    : Response.json({ runId: data.id, status: data.status, exceptions: data.exception_count });
});
