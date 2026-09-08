import { corsHeaders } from "../_shared/cors.ts";
import { adminClient } from "../_shared/supabase.ts";

const hex = (buffer: ArrayBuffer) =>
  [...new Uint8Array(buffer)].map((value) => value.toString(16).padStart(2, "0")).join("");
const safeEqual = (a: string, b: string) => {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
};

Deno.serve(async (request) => {
  if (request.method !== "POST")
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders,
    });
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature") ?? "";
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(Deno.env.get("PAYSTACK_SECRET_KEY")!),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"],
  );
  const expected = hex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody)));
  if (!safeEqual(signature, expected)) return new Response("Invalid signature", { status: 401 });

  const event = JSON.parse(rawBody);
  const payloadHash = hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(rawBody)));
  if (String(event.event).startsWith("refund.")) {
    const status = String(event.event).replace("refund.", "");
    if (!["pending", "processing", "needs-attention", "processed", "failed"].includes(status))
      return new Response("ok", { status: 200 });
    const reference = event.data?.transaction_reference;
    const amount = Number(event.data?.amount);
    if (
      !reference ||
      !Number.isSafeInteger(amount) ||
      amount <= 0 ||
      event.data?.currency !== "NGN"
    )
      return new Response("Invalid refund event", { status: 422 });
    const { error } = await adminClient().rpc("process_refund_event", {
      p_transaction_reference: reference,
      p_amount_kobo: amount,
      p_status: status === "needs-attention" ? "failed" : status,
      p_provider_reference: String(event.data?.refund_reference ?? event.data?.id ?? ""),
      p_event_key: `${event.event}:${event.data?.refund_reference ?? event.data?.id ?? `${reference}:${amount}`}`,
      p_event_hash: payloadHash,
    });
    return error
      ? new Response("Refund processing failed", { status: 500 })
      : new Response("ok", { status: 200 });
  }
  if (
    ["charge.dispute.create", "charge.dispute.remind", "charge.dispute.resolve"].includes(
      event.event,
    )
  ) {
    const reference = event.data?.transaction?.reference ?? event.data?.transaction_reference;
    const amount = Number(event.data?.amount ?? event.data?.transaction?.amount);
    const providerId = String(event.data?.id ?? event.data?.dispute_id ?? "");
    if (!reference || !providerId || !Number.isSafeInteger(amount) || amount <= 0)
      return new Response("Invalid dispute event", { status: 422 });
    const { error } = await adminClient().rpc("process_chargeback_event", {
      p_reference: String(reference),
      p_amount_kobo: amount,
      p_event_type: String(event.event),
      p_event_key: `${event.event}:${providerId}`,
      p_event_hash: payloadHash,
      p_provider_id: providerId,
    });
    return error
      ? new Response("Dispute processing failed", { status: 500 })
      : new Response("ok", { status: 200 });
  }
  if (["transfer.success", "transfer.failed", "transfer.reversed"].includes(event.event)) {
    const reference = String(event.data?.reference ?? event.data?.transfer_code ?? "");
    if (!reference) return new Response("Invalid transfer event", { status: 422 });
    const { error } = await adminClient().rpc("process_payout_event", {
      p_reference: reference,
      p_event_type: String(event.event),
      p_event_key: `${event.event}:${event.data?.id ?? reference}`,
      p_event_hash: payloadHash,
    });
    return error
      ? new Response("Transfer processing failed", { status: 500 })
      : new Response("ok", { status: 200 });
  }
  if (event.event !== "charge.success") return new Response("ok", { status: 200 });
  const reference = event.data?.reference;
  if (!reference) return new Response("Missing reference", { status: 400 });

  const verify = await fetch(
    `${Deno.env.get("PAYSTACK_API_URL") ?? "https://api.paystack.co"}/transaction/verify/${encodeURIComponent(reference)}`,
    {
      headers: {
        Authorization: `Bearer ${Deno.env.get("PAYSTACK_SECRET_KEY")}`,
      },
    },
  );
  const verified = await verify.json();
  if (
    !verify.ok ||
    verified.data?.status !== "success" ||
    verified.data?.currency !== "NGN" ||
    verified.data?.reference !== reference ||
    !Number.isSafeInteger(verified.data?.amount)
  )
    return new Response("Verification failed", { status: 422 });

  const eventKey = `${event.event}:${event.data.id ?? reference}`;
  const { error } = await adminClient().rpc("process_successful_payment", {
    p_reference: reference,
    p_amount_kobo: verified.data.amount,
    p_event_key: eventKey,
    p_event_hash: payloadHash,
  });
  if (error) return new Response("Processing failed", { status: 500 });
  return new Response("ok", { status: 200 });
});
