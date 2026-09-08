"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient, createClient, requireAdmin } from "../../lib/supabase/server";

const uuid = z.string().uuid();
const audit = async (
  adminId: string,
  action: string,
  entityId: string,
  reason: string,
  correlationId: string,
) =>
  createAdminClient().from("admin_audit_events").insert({
    admin_id: adminId,
    action,
    entity_type: "booking",
    entity_id: entityId,
    reason,
    correlation_id: correlationId,
  });
export async function claimRequest(form: FormData) {
  const admin = await requireAdmin("bookings");
  const bookingId = uuid.parse(form.get("bookingId"));
  const client = createAdminClient();
  const { data, error } = await client
    .from("bookings")
    .update({ status: "operations_review", claimed_by: admin.id })
    .eq("id", bookingId)
    .eq("status", "requested")
    .select("id,correlation_id")
    .single();
  if (error) throw new Error("Request is no longer available to claim");
  await client.from("booking_operations_notes").insert({
    booking_id: bookingId,
    admin_id: admin.id,
    note_type: "claim",
    body: "Request claimed for operations review",
  });
  await audit(admin.id, "booking.claimed", bookingId, "Request claimed", data.correlation_id);
  revalidatePath("/bookings");
}
export async function addContactNote(form: FormData) {
  const admin = await requireAdmin("bookings");
  const bookingId = uuid.parse(form.get("bookingId"));
  const body = z.string().trim().min(2).max(2000).parse(form.get("body"));
  const client = createAdminClient();
  const { error } = await client
    .from("booking_operations_notes")
    .insert({ booking_id: bookingId, admin_id: admin.id, note_type: "vendor_contact", body });
  if (error) throw new Error("Could not record contact attempt");
  const { data: booking } = await client
    .from("bookings")
    .select("correlation_id")
    .eq("id", bookingId)
    .single();
  if (booking)
    await audit(admin.id, "vendor_contact.recorded", bookingId, body, booking.correlation_id);
  revalidatePath("/bookings");
}
export async function declineRequest(form: FormData) {
  const admin = await requireAdmin("bookings");
  const bookingId = uuid.parse(form.get("bookingId"));
  const reason = z.string().trim().min(5).max(500).parse(form.get("reason"));
  const client = createAdminClient();
  const { data, error } = await client
    .from("bookings")
    .update({ status: "declined" })
    .eq("id", bookingId)
    .in("status", ["requested", "operations_review"])
    .select("correlation_id")
    .single();
  if (error) throw new Error("Request cannot be declined in its current state");
  await client
    .from("booking_operations_notes")
    .insert({ booking_id: bookingId, admin_id: admin.id, note_type: "decline", body: reason });
  await audit(admin.id, "booking.declined", bookingId, reason, data.correlation_id);
  revalidatePath("/bookings");
}
const Quote = z
  .object({
    bookingId: uuid,
    expectedRevision: z.coerce.number().int().nonnegative(),
    totalNaira: z.coerce.number().int().positive(),
    depositNaira: z.coerce.number().int().positive(),
    expiresAt: z.string().min(1),
    cancellationSummary: z.string().trim().min(20).max(1500),
    inclusions: z.string(),
    exclusions: z.string(),
    paymentSchedule: z.string().trim().min(5).max(500),
  })
  .refine((v) => v.depositNaira <= v.totalNaira, { message: "Deposit cannot exceed total" });
const lines = (value: string) =>
  value
    .split("\n")
    .map((v) => v.trim())
    .filter(Boolean);
export async function issueQuote(form: FormData) {
  await requireAdmin("bookings");
  if (form.get("availabilityConfirmed") !== "yes")
    throw new Error("Vendor availability confirmation is required");
  const input = Quote.parse(Object.fromEntries(form));
  const expires = new Date(input.expiresAt);
  if (expires <= new Date()) throw new Error("Quote expiry must be in the future");
  const { error } = await (
    await createClient()
  ).rpc("admin_issue_quote", {
    p_booking_id: input.bookingId,
    p_expected_revision: input.expectedRevision,
    p_total_kobo: input.totalNaira * 100,
    p_deposit_kobo: input.depositNaira * 100,
    p_expires_at: expires.toISOString(),
    p_cancellation_summary: input.cancellationSummary,
    p_inclusions: lines(input.inclusions),
    p_exclusions: lines(input.exclusions),
    p_payment_schedule: input.paymentSchedule,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/bookings");
}

export async function expireQuote(form: FormData) {
  const admin = await requireAdmin("bookings");
  if (form.get("confirmed") !== "yes")
    throw new Error("Explicit quote expiry confirmation is required");
  const bookingId = uuid.parse(form.get("bookingId"));
  const reason = z.string().trim().min(5).max(500).parse(form.get("reason"));
  const client = createAdminClient();
  const { data, error } = await client
    .from("bookings")
    .update({ status: "expired" })
    .eq("id", bookingId)
    .eq("status", "quote_ready")
    .select("correlation_id")
    .single();
  if (error || !data) throw new Error("Only a current unaccepted quote can be expired");
  await client.from("booking_operations_notes").insert({
    booking_id: bookingId,
    admin_id: admin.id,
    note_type: "quote_expired",
    body: reason,
  });
  await audit(admin.id, "quote.expired", bookingId, reason, data.correlation_id);
  revalidatePath("/bookings");
}
