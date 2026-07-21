import { corsHeaders } from "../_shared/cors.ts";
import { adminClient, userClient } from "../_shared/supabase.ts";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (Deno.env.get("PAYMENTS_SANDBOX_ENABLED") !== "true" && Deno.env.get("PAYMENTS_LIVE_ENABLED") !== "true") return json({ error: "Payments are gated", code: "PAYMENT_GATE_CLOSED" }, 503);

  const authorization = request.headers.get("Authorization") ?? "";
  const client = userClient(authorization);
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user) return json({ error: "Unauthorized" }, 401);

  const body = await request.json().catch(() => null) as { bookingId?: string; quoteId?: string } | null;
  if (!body?.bookingId || !body.quoteId) return json({ error: "bookingId and quoteId are required" }, 400);

  const admin = adminClient();
  const { data: booking } = await admin.from("bookings").select("id,customer_id,status").eq("id", body.bookingId).single();
  const { data: quote } = await admin.from("quotes").select("id,booking_id,deposit_amount_kobo,expires_at").eq("id", body.quoteId).single();
  if (!booking || !quote || booking.customer_id !== user.id || quote.booking_id !== booking.id) return json({ error: "Booking or quote not found" }, 404);
  if (booking.status !== "accepted_awaiting_payment") return json({ error: "Booking is not ready for payment" }, 409);
  if (new Date(quote.expires_at) <= new Date()) return json({ error: "Quote has expired" }, 409);

  const { data: existing } = await admin.from("payments").select("provider_reference,authorization_url").eq("quote_id",quote.id).in("status",["initiated","pending"]).maybeSingle();
  if (existing?.authorization_url) return json({ authorizationUrl:existing.authorization_url,reference:existing.provider_reference,reused:true });
  const { data: profile } = await admin.from("profiles").select("email").eq("id",user.id).single();
  const email = user.email ?? profile?.email;
  if (!email) return json({ error:"A receipt email is required before payment" },400);

  const reference = `mm_${crypto.randomUUID().replaceAll("-", "")}`;
  const { error: insertError } = await admin.from("payments").insert({
    booking_id: booking.id, quote_id: quote.id, customer_id: user.id, provider: "paystack",
    provider_reference: reference, amount_kobo: quote.deposit_amount_kobo, status: "initiated",
  });
  if (insertError) return json({ error: "Unable to create payment" }, 500);

  const response = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: { Authorization: `Bearer ${Deno.env.get("PAYSTACK_SECRET_KEY")}`, "Content-Type": "application/json" },
    body: JSON.stringify({ email, amount: quote.deposit_amount_kobo, currency: "NGN", reference, callback_url:`mmemme://booking/${booking.id}`, metadata: { booking_id: booking.id, quote_id: quote.id } }),
  });
  const result = await response.json();
  if (!response.ok || !result.status) {
    await admin.from("payments").update({ status: "failed", raw_provider_status: result.message ?? "initialize_failed" }).eq("provider_reference", reference);
    return json({ error: "Payment provider unavailable" }, 502);
  }
  await admin.from("payments").update({ status: "pending",authorization_url:result.data.authorization_url }).eq("provider_reference", reference);
  return json({ authorizationUrl: result.data.authorization_url, accessCode: result.data.access_code, reference });
});
