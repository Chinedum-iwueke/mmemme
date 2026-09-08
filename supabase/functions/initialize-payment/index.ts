import { corsHeaders } from "../_shared/cors.ts";
import { adminClient, userClient } from "../_shared/supabase.ts";
import { failure, InitializePaymentRequest, success } from "../_shared/api.ts";

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return failure("INVALID_REQUEST", 405);
  if (
    Deno.env.get("PAYMENTS_SANDBOX_ENABLED") !== "true" &&
    Deno.env.get("PAYMENTS_LIVE_ENABLED") !== "true"
  )
    return failure("PAYMENT_GATE_CLOSED", 503);

  const authorization = request.headers.get("Authorization") ?? "";
  const client = userClient(authorization);
  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser();
  if (authError || !user) return failure("UNAUTHORIZED", 401);

  const parsed = InitializePaymentRequest.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return failure("INVALID_REQUEST", 400);
  const body = parsed.data;

  const admin = adminClient();
  const { data: booking } = await admin
    .from("bookings")
    .select("id,customer_id,status")
    .eq("id", body.bookingId)
    .single();
  const { data: quote } = await admin
    .from("quotes")
    .select("id,booking_id,deposit_amount_kobo,expires_at")
    .eq("id", body.quoteId)
    .single();
  if (!booking || !quote || booking.customer_id !== user.id || quote.booking_id !== booking.id)
    return failure("NOT_FOUND", 404);
  if (booking.status !== "accepted_awaiting_payment") return failure("CONFLICT", 409);
  if (new Date(quote.expires_at) <= new Date()) return failure("CONFLICT", 409);

  const { data: existing } = await admin
    .from("payments")
    .select("provider_reference,authorization_url")
    .eq("quote_id", quote.id)
    .in("status", ["initiated", "pending"])
    .maybeSingle();
  if (existing?.authorization_url)
    return success({
      authorizationUrl: existing.authorization_url,
      reference: existing.provider_reference,
      reused: true,
    });
  const { data: profile } = await admin.from("profiles").select("email").eq("id", user.id).single();
  const email = user.email ?? profile?.email;
  if (!email) return failure("INVALID_REQUEST", 400);

  const reference = existing?.provider_reference ?? `mm_${crypto.randomUUID().replaceAll("-", "")}`;
  const webOrigin = Deno.env.get("PUBLIC_WEB_URL");
  const callbackUrl =
    body.channel === "web" && webOrigin
      ? `${webOrigin}/checkout/return?booking=${booking.id}`
      : `mmemme://booking/${booking.id}`;
  if (!existing) {
    const { error: insertError } = await admin.from("payments").insert({
      booking_id: booking.id,
      quote_id: quote.id,
      customer_id: user.id,
      provider: "paystack",
      provider_reference: reference,
      amount_kobo: quote.deposit_amount_kobo,
      status: "initiated",
    });
    if (insertError)
      return failure(
        insertError.code === "23505" ? "CONFLICT" : "INTERNAL_ERROR",
        insertError.code === "23505" ? 409 : 500,
      );
  }

  const response = await fetch(
    `${Deno.env.get("PAYSTACK_API_URL") ?? "https://api.paystack.co"}/transaction/initialize`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${Deno.env.get("PAYSTACK_SECRET_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: quote.deposit_amount_kobo,
        currency: "NGN",
        reference,
        callback_url: callbackUrl,
        metadata: { booking_id: booking.id, quote_id: quote.id },
      }),
    },
  );
  const result = await response.json();
  if (!response.ok || !result.status) {
    await admin
      .from("payments")
      .update({ raw_provider_status: result.message ?? "initialize_retryable" })
      .eq("provider_reference", reference);
    return failure("PROVIDER_UNAVAILABLE", 502);
  }
  await admin
    .from("payments")
    .update({ status: "pending", authorization_url: result.data.authorization_url })
    .eq("provider_reference", reference);
  return success({
    authorizationUrl: result.data.authorization_url,
    accessCode: result.data.access_code,
    reference,
  });
});
