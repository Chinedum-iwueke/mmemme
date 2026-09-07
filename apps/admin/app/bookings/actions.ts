"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient, requireAdmin } from "../../lib/supabase/server";

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
  const admin = await requireAdmin("bookings");
  if (form.get("availabilityConfirmed") !== "yes")
    throw new Error("Vendor availability confirmation is required");
  const input = Quote.parse(Object.fromEntries(form));
  const expires = new Date(input.expiresAt);
  if (expires <= new Date()) throw new Error("Quote expiry must be in the future");
  const client = createAdminClient();
  const { data: booking } = await client
    .from("bookings")
    .select("id,status,package_id,correlation_id")
    .eq("id", input.bookingId)
    .single();
  if (!booking || !["operations_review", "quote_ready"].includes(booking.status))
    throw new Error("Booking is not ready for a quote");
  const { data: pkg } = booking.package_id
    ? await client.from("service_packages").select("name").eq("id", booking.package_id).single()
    : { data: null };
  const { data: last } = await client
    .from("quotes")
    .select("revision")
    .eq("booking_id", booking.id)
    .order("revision", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { error } = await client.from("quotes").insert({
    booking_id: booking.id,
    revision: (last?.revision ?? 0) + 1,
    total_amount_kobo: input.totalNaira * 100,
    deposit_amount_kobo: input.depositNaira * 100,
    platform_fee_bps: 750,
    cancellation_template_version: "beta-2026-07",
    cancellation_summary: input.cancellationSummary,
    terms_version: "beta-2026-07",
    expires_at: expires.toISOString(),
    created_by: admin.id,
    package_name_snapshot: pkg?.name ?? "Custom service",
    inclusions: lines(input.inclusions),
    exclusions: lines(input.exclusions),
    payment_schedule: input.paymentSchedule,
    availability_confirmed_at: new Date().toISOString(),
  });
  if (error) throw new Error("Could not issue quote");
  if (booking.status === "operations_review")
    await client.from("bookings").update({ status: "quote_ready" }).eq("id", booking.id);
  await client.from("booking_operations_notes").insert({
    booking_id: booking.id,
    admin_id: admin.id,
    note_type: "quote",
    body: `Quote revision ${(last?.revision ?? 0) + 1} issued`,
  });
  await audit(
    admin.id,
    "quote.issued",
    booking.id,
    "Availability confirmed and quote issued",
    booking.correlation_id,
  );
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
