"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient, requireAdmin } from "../../lib/supabase/server";
import { redirect } from "next/navigation";

const uuid = z.string().uuid();
const Entity = z.enum([
  "booking",
  "vendor_application",
  "support",
  "cancellation",
  "refund",
  "dispute",
  "payout",
  "reconciliation",
]);

export async function assignCase(form: FormData) {
  await requireAdmin("dashboard");
  const client = await createClient();
  const entityType = Entity.parse(form.get("entityType"));
  const entityId = uuid.parse(form.get("entityId"));
  const correlationId = uuid.parse(form.get("correlationId"));
  const dueValue = String(form.get("dueAt") ?? "");
  if (!dueValue) throw new Error("A case deadline is required");
  const dueAt = new Date(dueValue);
  if (Number.isNaN(dueAt.getTime())) throw new Error("Choose a valid deadline");
  const { error } = await client.rpc("assign_operations_case", {
    p_entity_type: entityType,
    p_entity_id: entityId,
    p_assigned_to: uuid.parse(form.get("assignedTo")),
    p_due_at: dueAt.toISOString(),
    p_priority: z.enum(["low", "normal", "high", "urgent"]).parse(form.get("priority")),
    p_reason: z.string().trim().min(5).max(1000).parse(form.get("reason")),
    p_correlation_id: correlationId,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/bookings");
  revalidatePath("/safety");
  revalidatePath("/vendors/applications");
}

export async function saveQueue(form: FormData) {
  const admin = await requireAdmin("dashboard");
  const scope = z
    .enum(["bookings", "vendors", "support", "money", "audit"])
    .parse(form.get("scope"));
  const name = z.string().trim().min(2).max(80).parse(form.get("name"));
  const status = z
    .string()
    .trim()
    .max(80)
    .parse(form.get("status") ?? "");
  const { error } = await (await createClient()).from("saved_operation_queues").insert({
    owner_id: admin.id,
    name,
    scope,
    filters: { status },
  });
  if (error) throw new Error("Could not save this queue; use a unique name");
  revalidatePath(`/${scope === "vendors" ? "vendors/applications" : scope}`);
}

export async function signOutOperator() {
  const client = await createClient();
  await client.auth.signOut();
  redirect("/login");
}
