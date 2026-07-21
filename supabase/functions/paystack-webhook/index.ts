import { corsHeaders } from "../_shared/cors.ts";
import { adminClient } from "../_shared/supabase.ts";

const hex = (buffer: ArrayBuffer) => [...new Uint8Array(buffer)].map((value) => value.toString(16).padStart(2, "0")).join("");
const safeEqual = (a: string, b: string) => {
  if (a.length !== b.length) return false;
  let mismatch = 0; for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i); return mismatch === 0;
};

Deno.serve(async (request) => {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature") ?? "";
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(Deno.env.get("PAYSTACK_SECRET_KEY")!), { name: "HMAC", hash: "SHA-512" }, false, ["sign"]);
  const expected = hex(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(rawBody)));
  if (!safeEqual(signature, expected)) return new Response("Invalid signature", { status: 401 });

  const event = JSON.parse(rawBody);
  if (event.event !== "charge.success") return new Response("ok", { status: 200 });
  const reference = event.data?.reference;
  if (!reference) return new Response("Missing reference", { status: 400 });

  const verify = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, { headers: { Authorization: `Bearer ${Deno.env.get("PAYSTACK_SECRET_KEY")}` } });
  const verified = await verify.json();
  if (!verify.ok || verified.data?.status !== "success" || verified.data?.currency !== "NGN") return new Response("Verification failed", { status: 422 });

  const payloadHash = hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(rawBody)));
  const eventKey = `${event.event}:${event.data.id ?? reference}`;
  const { error } = await adminClient().rpc("process_successful_payment", { p_reference: reference, p_amount_kobo: verified.data.amount, p_event_key: eventKey, p_event_hash: payloadHash });
  if (error) return new Response("Processing failed", { status: 500 });
  return new Response("ok", { status: 200 });
});
