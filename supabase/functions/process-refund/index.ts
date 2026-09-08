import { corsHeaders } from "../_shared/cors.ts";
import { adminClient, userClient } from "../_shared/supabase.ts";
import { failure, RefundRequest, success } from "../_shared/api.ts";
Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return failure("INVALID_REQUEST", 405);
  const auth = request.headers.get("Authorization") ?? "";
  const userApi = userClient(auth);
  const {
    data: { user },
  } = await userApi.auth.getUser();
  if (!user) return failure("UNAUTHORIZED", 401);
  const admin = adminClient();
  const { data: allowed } = await userApi.rpc("admin_has_capability", { p_capability: "money" });
  if (!allowed) return failure("FORBIDDEN", 403);
  const parsed = RefundRequest.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return failure("INVALID_REQUEST", 400);
  const { refundId } = parsed.data;
  const { data: r } = await admin
    .from("refunds")
    .select("id,amount_kobo,status,payments(provider_reference)")
    .eq("id", refundId)
    .single();
  if (!r || !["approved", "failed"].includes(r.status)) return failure("CONFLICT", 409);
  const { data: claimed } = await admin
    .from("refunds")
    .update({ status: "processing", failure_reason: null, updated_at: new Date().toISOString() })
    .eq("id", r.id)
    .in("status", ["approved", "failed"])
    .select("id")
    .maybeSingle();
  if (!claimed) return failure("CONFLICT", 409);
  if (Deno.env.get("PAYMENTS_DEMO_MODE") === "true") {
    const { error } = await admin.rpc("process_refund_event", {
      p_transaction_reference: r.payments.provider_reference,
      p_amount_kobo: r.amount_kobo,
      p_status: "processed",
      p_provider_reference: `demo_refund_${r.id}`,
      p_event_key: `refund.processed:demo:${r.id}`,
      p_event_hash: "demo",
    });
    return error
      ? json({ error: error.message }, 500)
      : success({ status: "succeeded", demo: true });
  }
  const response = await fetch(
    `${Deno.env.get("PAYSTACK_API_URL") ?? "https://api.paystack.co"}/refund`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("PAYSTACK_SECRET_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transaction: r.payments.provider_reference,
        amount: r.amount_kobo,
        customer_note: "MMEMME approved cancellation refund",
        merchant_note: `MMEMME refund ${r.id}`,
      }),
    },
  );
  const result = await response.json();
  if (!response.ok || !result.status) {
    await admin
      .from("refunds")
      .update({
        status: "failed",
        failure_reason: result.message ?? "Refund initialization failed",
      })
      .eq("id", r.id);
    return failure("PROVIDER_UNAVAILABLE", 502);
  }
  await admin
    .from("refunds")
    .update({
      provider_reference: String(result.data?.id ?? result.data?.refund_reference ?? ""),
    })
    .eq("id", r.id);
  return success({ status: "processing" });
});
