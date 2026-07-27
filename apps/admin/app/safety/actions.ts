"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  createAdminClient,
  createClient,
  requireAdmin,
} from "../../lib/supabase/server";
const uuid = z.string().uuid();
const reason = (v: FormDataEntryValue | null) =>
  z.string().trim().min(5).max(2000).parse(v);
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
  const admin = await requireAdmin();
  const bookingId = uuid.parse(form.get("bookingId"));
  const body = reason(form.get("body"));
  const { error } = await createAdminClient()
    .from("support_messages")
    .insert({ booking_id: bookingId, author_id: admin.id, body });
  if (error) throw new Error("Could not send reply");
  revalidatePath("/safety");
}
export async function decideCancellation(form: FormData) {
  const admin = await requireAdmin();
  const cancellationId = uuid.parse(form.get("cancellationId"));
  const approve = form.get("decision") === "approve";
  const why = reason(form.get("reason"));
  const client = createAdminClient();
  const { data: c } = await client
    .from("cancellations")
    .select("*,bookings(correlation_id,status)")
    .eq("id", cancellationId)
    .eq("status", "requested")
    .single();
  if (!c) throw new Error("Cancellation is no longer pending");
  if (!approve) {
    await client
      .from("cancellations")
      .update({
        status: "rejected",
        decided_by: admin.id,
        decided_at: new Date().toISOString(),
        decision_reason: why,
      })
      .eq("id", c.id);
    await audit(
      admin.id,
      "cancellation.rejected",
      "cancellation",
      c.id,
      why,
      c.bookings.correlation_id,
    );
    revalidatePath("/safety");
    return;
  }
  await client
    .from("cancellations")
    .update({
      status: "approved",
      decided_by: admin.id,
      decided_at: new Date().toISOString(),
      decision_reason: why,
    })
    .eq("id", c.id);
  await client
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", c.booking_id);
  if (c.refundable_amount_kobo > 0) {
    const { data: payment } = await client
      .from("payments")
      .select("id")
      .eq("booking_id", c.booking_id)
      .in("status", ["succeeded", "partially_refunded"])
      .order("paid_at", { ascending: false })
      .limit(1)
      .single();
    if (payment)
      await client.from("refunds").insert({
        cancellation_id: c.id,
        booking_id: c.booking_id,
        payment_id: payment.id,
        amount_kobo: c.refundable_amount_kobo,
        requested_by: admin.id,
      });
  }
  await audit(
    admin.id,
    "cancellation.approved",
    "cancellation",
    c.id,
    why,
    c.bookings.correlation_id,
  );
  revalidatePath("/safety");
}
export async function approveRefund(form: FormData) {
  const admin = await requireAdmin();
  const refundId = uuid.parse(form.get("refundId"));
  const why = reason(form.get("reason"));
  const client = createAdminClient();
  const { data: r } = await client
    .from("refunds")
    .select("*,bookings(correlation_id)")
    .eq("id", refundId)
    .single();
  if (!r) throw new Error("Refund not found");
  if (r.status === "awaiting_first_approval") {
    await client
      .from("refunds")
      .update({
        status: "awaiting_second_approval",
        first_approved_by: admin.id,
        approval_reason: why,
        updated_at: new Date().toISOString(),
      })
      .eq("id", r.id);
  } else if (r.status === "awaiting_second_approval") {
    if (r.first_approved_by === admin.id)
      throw new Error(
        "A different administrator must provide the second approval",
      );
    await client
      .from("refunds")
      .update({
        status: "approved",
        second_approved_by: admin.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", r.id);
  } else throw new Error("Refund is not awaiting approval");
  await audit(
    admin.id,
    "refund.approval",
    "refund",
    r.id,
    why,
    r.bookings.correlation_id,
  );
  revalidatePath("/safety");
  revalidatePath("/money");
}

export async function executeRefund(form: FormData) {
  await requireAdmin();
  const refundId = uuid.parse(form.get("refundId"));
  const client = await createClient();
  const { data, error } = await client.functions.invoke("process-refund", {
    body: { refundId },
  });
  if (error || data?.error)
    throw new Error(data?.error ?? "Refund processing could not start");
  revalidatePath("/safety");
  revalidatePath("/money");
}
export async function resolveDispute(form: FormData) {
  const admin = await requireAdmin();
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
  const admin = await requireAdmin();
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
  await audit(
    admin.id,
    `booking.${next}`,
    "booking",
    bookingId,
    why,
    b.correlation_id,
  );
  revalidatePath("/safety");
}
export async function approvePayoutEligibility(form: FormData) {
  const admin = await requireAdmin();
  const payoutId = uuid.parse(form.get("payoutId"));
  const why = reason(form.get("reason"));
  const client = createAdminClient();
  const { data: p } = await client
    .from("payouts")
    .select("*,bookings(correlation_id,status)")
    .eq("id", payoutId)
    .single();
  if (
    !p ||
    p.status !== "held" ||
    !["fulfilled", "completed"].includes(p.bookings.status)
  )
    throw new Error("Payout is not eligible for approval");
  const { data: a } = await client
    .from("payout_approvals")
    .select("*")
    .eq("payout_id", payoutId)
    .maybeSingle();
  if (!a)
    await client.from("payout_approvals").insert({
      payout_id: payoutId,
      first_approved_by: admin.id,
      reason: why,
    });
  else {
    if (a.first_approved_by === admin.id)
      throw new Error(
        "A different administrator must confirm payout eligibility",
      );
    await client
      .from("payout_approvals")
      .update({
        second_approved_by: admin.id,
        second_approved_at: new Date().toISOString(),
      })
      .eq("payout_id", payoutId);
    await client
      .from("payouts")
      .update({
        status: "eligible",
        approved_by: admin.id,
        approved_at: new Date().toISOString(),
      })
      .eq("id", payoutId);
  }
  await audit(
    admin.id,
    "payout.eligibility_approval",
    "payout",
    payoutId,
    why,
    p.bookings.correlation_id,
  );
  revalidatePath("/safety");
  revalidatePath("/money");
}
export async function runReconciliation() {
  const admin = await requireAdmin();
  const client = createAdminClient();
  const [{ data: payments }, { data: entries }] = await Promise.all([
    client.from("payments").select("id,amount_kobo,status"),
    client.from("ledger_entries").select("payment_id,entry_type,amount_kobo"),
  ]);
  const succeeded = payments?.filter((p) => p.status === "succeeded") ?? [];
  const exceptions = succeeded.filter((p) => {
    const rows = entries?.filter((e) => e.payment_id === p.id) ?? [];
    const gross = rows.find((e) => e.entry_type === "gross")?.amount_kobo ?? 0;
    return (
      gross !==
      rows
        .filter((e) => ["platform_fee", "vendor_net"].includes(e.entry_type))
        .reduce((n, e) => n + e.amount_kobo, 0)
    );
  });
  await client.from("reconciliation_runs").upsert(
    {
      run_date: new Date().toISOString().slice(0, 10),
      status: exceptions.length ? "exceptions" : "balanced",
      payment_count: succeeded.length,
      gross_kobo: succeeded.reduce((n, p) => n + p.amount_kobo, 0),
      exception_count: exceptions.length,
      details: { paymentIds: exceptions.map((e) => e.id) },
      run_by: admin.id,
    },
    { onConflict: "run_date" },
  );
  revalidatePath("/safety");
}
