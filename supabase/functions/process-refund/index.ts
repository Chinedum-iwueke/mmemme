import { corsHeaders } from "../_shared/cors.ts";
import { adminClient, userClient } from "../_shared/supabase.ts";
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
Deno.serve(async (request) => {
  if (request.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST")
    return json({ error: "Method not allowed" }, 405);
  const auth = request.headers.get("Authorization") ?? "";
  const userApi = userClient(auth);
  const {
    data: { user },
  } = await userApi.auth.getUser();
  if (!user) return json({ error: "Unauthorized" }, 401);
  const admin = adminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!profile?.is_admin) return json({ error: "Forbidden" }, 403);
  const { refundId } = await request.json().catch(() => ({}));
  const { data: r } = await admin
    .from("refunds")
    .select("id,amount_kobo,status,payments(provider_reference)")
    .eq("id", refundId)
    .single();
  if (!r || r.status !== "approved")
    return json({ error: "Refund is not approved" }, 409);
  await admin
    .from("refunds")
    .update({ status: "processing", updated_at: new Date().toISOString() })
    .eq("id", r.id);
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
      : json({ status: "succeeded", demo: true });
  }
  const response = await fetch("https://api.paystack.co/refund", {
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
  });
  const result = await response.json();
  if (!response.ok || !result.status) {
    await admin
      .from("refunds")
      .update({
        status: "failed",
        failure_reason: result.message ?? "Refund initialization failed",
      })
      .eq("id", r.id);
    return json({ error: "Provider rejected refund" }, 502);
  }
  await admin
    .from("refunds")
    .update({
      provider_reference: String(
        result.data?.id ?? result.data?.refund_reference ?? "",
      ),
    })
    .eq("id", r.id);
  return json({ status: "processing" });
});
