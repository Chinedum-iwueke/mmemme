"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCustomer } from "../../../lib/supabase/server";
const bookingId = (form: FormData) => String(form.get("bookingId") || "");
export async function acceptQuote(form: FormData) {
  const id = bookingId(form),
    quoteId = String(form.get("quoteId") || "");
  const { client } = await requireCustomer(`/bookings/${id}`);
  const { error } = await client.rpc("accept_quote", { p_booking_id: id, p_quote_id: quoteId });
  if (error) redirect(`/bookings/${id}?error=stale_quote`);
  revalidatePath(`/bookings/${id}`);
}
export async function beginCheckout(form: FormData) {
  const id = bookingId(form),
    quoteId = String(form.get("quoteId") || "");
  const { client } = await requireCustomer(`/bookings/${id}`);
  const { data, error } = await client.functions.invoke("initialize-payment", {
    body: { bookingId: id, quoteId, channel: "web" },
  });
  if (error || !data?.ok || !data.data?.authorizationUrl)
    redirect(`/bookings/${id}?error=payment_unavailable`);
  redirect(data.data.authorizationUrl);
}
export async function sendSupport(form: FormData) {
  const id = bookingId(form),
    body = String(form.get("body") || "").trim();
  const { client, user } = await requireCustomer(`/bookings/${id}`);
  if (body.length < 1 || body.length > 3000) redirect(`/bookings/${id}?error=support`);
  const { error } = await client
    .from("support_messages")
    .insert({ booking_id: id, author_id: user.id, body });
  if (error) redirect(`/bookings/${id}?error=support`);
  revalidatePath(`/bookings/${id}`);
}
export async function requestCancellation(form: FormData) {
  const id = bookingId(form),
    reason = String(form.get("reason") || "").trim();
  const { client } = await requireCustomer(`/bookings/${id}`);
  const { error } = await client.rpc("request_cancellation", {
    p_booking_id: id,
    p_reason: reason,
  });
  if (error) redirect(`/bookings/${id}?error=cancellation`);
  revalidatePath(`/bookings/${id}`);
}
export async function openDispute(form: FormData) {
  const id = bookingId(form),
    reason = String(form.get("reason") || "").trim();
  const { client } = await requireCustomer(`/bookings/${id}`);
  const { error } = await client.rpc("open_booking_dispute", {
    p_booking_id: id,
    p_reason: reason,
  });
  if (error) redirect(`/bookings/${id}?error=dispute`);
  revalidatePath(`/bookings/${id}`);
}
export async function uploadEvidence(form: FormData) {
  const id = bookingId(form),
    disputeId = String(form.get("disputeId") || "");
  const file = form.get("evidence");
  if (
    !(file instanceof File) ||
    file.size === 0 ||
    file.size > 10_485_760 ||
    !["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(file.type)
  )
    redirect(`/bookings/${id}?error=evidence`);
  const { client, user } = await requireCustomer(`/bookings/${id}`);
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
  const path = `${user.id}/${disputeId}/${crypto.randomUUID()}-${safe}`;
  const { error } = await client.storage
    .from("dispute-evidence")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) redirect(`/bookings/${id}?error=evidence`);
  const { error: rowError } = await client.from("dispute_evidence").insert({
    dispute_id: disputeId,
    uploaded_by: user.id,
    storage_path: path,
    media_type: file.type,
    description: file.name,
  });
  if (rowError) redirect(`/bookings/${id}?error=evidence`);
  revalidatePath(`/bookings/${id}`);
}
export async function confirmFulfillment(form: FormData) {
  const id = bookingId(form);
  const { client } = await requireCustomer(`/bookings/${id}`);
  const { error } = await client.rpc("confirm_fulfillment", { p_booking_id: id });
  if (error) redirect(`/bookings/${id}?error=fulfillment`);
  revalidatePath(`/bookings/${id}`);
}
export async function submitReview(form: FormData) {
  const id = bookingId(form),
    vendorId = String(form.get("vendorId") || ""),
    rating = Number(form.get("rating")),
    body = String(form.get("body") || "").trim();
  const { client, user } = await requireCustomer(`/bookings/${id}`);
  const { error } = await client
    .from("reviews")
    .insert({ booking_id: id, customer_id: user.id, vendor_id: vendorId, rating, body });
  if (error) redirect(`/bookings/${id}?error=review`);
  revalidatePath(`/bookings/${id}`);
}
