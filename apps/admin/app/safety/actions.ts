"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient, createClient, requireAdmin } from "../../lib/supabase/server";
const uuid = z.string().uuid();
const reason = (v: FormDataEntryValue | null) => z.string().trim().min(5).max(2000).parse(v);
const requireConfirmation = (form: FormData) => {
  if (form.get("confirmed") !== "yes") throw new Error("Explicit confirmation is required");
};
const audit = async (
  adminId: string,
  action: string,
  entityType: string,
  entityId: string,
  why: string,
  correlationId: string,
) =>
  createAdminClient().from("admin_audit_events").insert({
    admin_id: adminId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    reason: why,
    correlation_id: correlationId,
  });
export async function replySupport(form: FormData) {
  const admin = await requireAdmin("support");
  const bookingId = uuid.parse(form.get("bookingId"));
  const body = reason(form.get("body"));
  const client = createAdminClient();
  const { error } = await client
    .from("support_messages")
    .insert({ booking_id: bookingId, author_id: admin.id, body });
  if (error) throw new Error("Could not send reply");
  const { data: booking } = await client
    .from("bookings")
    .select("correlation_id")
    .eq("id", bookingId)
    .single();
  if (booking)
    await audit(
      admin.id,
      "support.replied",
      "booking",
      bookingId,
      "Sent reviewed support response",
      booking.correlation_id,
    );
  revalidatePath("/safety");
}
export async function decideCancellation(form: FormData) {
  requireConfirmation(form);
  await requireAdmin("support");
  const cancellationId = uuid.parse(form.get("cancellationId"));
  const approve = form.get("decision") === "approve";
  const why = reason(form.get("reason"));
  const { error } = await (
    await createClient()
  ).rpc("admin_decide_cancellation", {
    p_cancellation_id: cancellationId,
    p_approve: approve,
    p_reason: why,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/safety");
}
export async function approveRefund(form: FormData) {
  requireConfirmation(form);
  await requireAdmin("money");
  const refundId = uuid.parse(form.get("refundId"));
  const why = reason(form.get("reason"));
  const { error } = await (
    await createClient()
  ).rpc("admin_approve_refund", {
    p_refund_id: refundId,
    p_reason: why,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/safety");
  revalidatePath("/money");
}

export async function executeRefund(form: FormData) {
  requireConfirmation(form);
  await requireAdmin("money");
  const refundId = uuid.parse(form.get("refundId"));
  const client = await createClient();
  const { data, error } = await client.functions.invoke("process-refund", {
    body: { refundId },
  });
  if (error || data?.error) throw new Error(data?.error ?? "Refund processing could not start");
  revalidatePath("/safety");
  revalidatePath("/money");
}
export async function resolveDispute(form: FormData) {
  requireConfirmation(form);
  const admin = await requireAdmin("support");
  const disputeId = uuid.parse(form.get("disputeId"));
  const outcome = z
    .enum(["resolved_customer", "resolved_vendor", "closed"])
    .parse(form.get("outcome"));
  const why = reason(form.get("reason"));
  const client = createAdminClient();
  const { data: d } = await client
    .from("disputes")
    .update({
      status: outcome,
      resolution_note: why,
      resolved_by: admin.id,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", disputeId)
    .in("status", ["open", "investigating"])
    .select("booking_id,bookings(correlation_id)")
    .single();
  if (!d) throw new Error("Dispute is no longer open");
  await audit(
    admin.id,
    "dispute.resolved",
    "dispute",
    disputeId,
    why,
    (d.bookings as unknown as { correlation_id: string }).correlation_id,
  );
  revalidatePath("/safety");
}
export async function transitionFulfillment(form: FormData) {
  const admin = await requireAdmin("bookings");
  const bookingId = uuid.parse(form.get("bookingId"));
  const next = z.enum(["service_due", "completed"]).parse(form.get("next"));
  const why = reason(form.get("reason"));
  const client = createAdminClient();
  const expected = next === "service_due" ? "confirmed" : "fulfilled";
  const { data: b } = await client
    .from("bookings")
    .update({ status: next })
    .eq("id", bookingId)
    .eq("status", expected)
    .select("correlation_id")
    .single();
  if (!b) throw new Error("Booking is not in the required state");
  await audit(admin.id, `booking.${next}`, "booking", bookingId, why, b.correlation_id);
  revalidatePath("/safety");
}
export async function approvePayoutEligibility(form: FormData) {
  requireConfirmation(form);
  await requireAdmin("money");
  const payoutId = uuid.parse(form.get("payoutId"));
  const why = reason(form.get("reason"));
  const { error } = await (
    await createClient()
  ).rpc("admin_approve_payout", { p_payout_id: payoutId, p_reason: why });
  if (error) throw new Error(error.message);
  revalidatePath("/safety");
  revalidatePath("/money");
}
export async function runReconciliation() {
  await requireAdmin("money");
  const { error } = await (
    await createClient()
  ).rpc("run_financial_reconciliation", {
    p_run_date: new Date().toISOString().slice(0, 10),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/safety");
  revalidatePath("/money");
}

export async function resolveReconciliationException(form: FormData) {
  requireConfirmation(form);
  await requireAdmin("money");
  const client = await createClient();
  const { error } = await client.rpc("resolve_reconciliation_exception", {
    p_exception_id: uuid.parse(form.get("exceptionId")),
    p_reason: reason(form.get("reason")),
  });
  if (error) throw new Error(error.message);
  revalidatePath("/money");
}
