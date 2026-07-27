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
  if (Deno.env.get("PAYMENTS_DEMO_MODE") !== "true")
    return json({ error: "Demo payment mode is disabled" }, 404);
  const auth = request.headers.get("Authorization") ?? "";
  const {
    data: { user },
  } = await userClient(auth).auth.getUser();
  if (!user) return json({ error: "Unauthorized" }, 401);
  const { bookingId, quoteId } = await request.json().catch(() => ({}));
  const admin = adminClient();
  const { data: b } = await admin
    .from("bookings")
    .select("id,customer_id,status")
    .eq("id", bookingId)
    .single();
  const { data: q } = await admin
    .from("quotes")
    .select("id,booking_id,deposit_amount_kobo,expires_at")
    .eq("id", quoteId)
    .single();
  if (
    !b ||
    !q ||
    b.customer_id !== user.id ||
    q.booking_id !== b.id ||
    b.status !== "accepted_awaiting_payment"
  )
    return json({ error: "Booking is not payable" }, 409);
  const reference = `demo_${crypto.randomUUID().replaceAll("-", "")}`;
  const { data: p, error } = await admin
    .from("payments")
    .insert({
      booking_id: b.id,
      quote_id: q.id,
      customer_id: user.id,
      provider: "paystack",
      provider_reference: reference,
      amount_kobo: q.deposit_amount_kobo,
      status: "pending",
      raw_provider_status: "local_demo",
    })
    .select("id")
    .single();
  if (error) return json({ error: error.message }, 500);
  const { error: processError } = await admin.rpc(
    "process_successful_payment",
    {
      p_reference: reference,
      p_amount_kobo: q.deposit_amount_kobo,
      p_event_key: `charge.success:${reference}`,
      p_event_hash: "local-demo",
    },
  );
  return processError
    ? json({ error: processError.message }, 500)
    : json({ paymentId: p.id, reference, status: "succeeded" });
});
