"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient, createAdminClient, requireAdmin } from "../../../lib/supabase/server";

const uuid = z.string().uuid();
export async function reviewApplication(formData: FormData) {
  await requireAdmin("vendors");
  const applicationId = uuid.parse(formData.get("applicationId"));
  const status = z
    .enum([
      "in_review",
      "inspection_pending",
      "changes_requested",
      "approved",
      "rejected",
      "suspended",
      "expired",
    ])
    .parse(formData.get("status"));
  const reason = z.string().trim().min(10).max(1000).parse(formData.get("reason"));
  const fields = String(formData.get("fields") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const client = await createClient();
  const { data, error } = await client.rpc("review_vendor_application", {
    p_application_id: applicationId,
    p_new_status: status,
    p_reason: reason,
    p_fields: fields,
  });
  if (error) throw new Error(error.message);
  if (status === "approved" && data.vendor_id) {
    const adminClient = createAdminClient();
    const { data: listing } = await adminClient
      .from("vendor_listing_drafts")
      .select("portfolio_paths")
      .eq("application_id", applicationId)
      .single();
    const source = listing?.portfolio_paths?.[0];
    if (source) {
      const { data: image } = await adminClient.storage.from("vendor-draft-media").download(source);
      if (image) {
        const target = `${data.vendor_id}/hero.webp`;
        const { error: uploadError } = await adminClient.storage
          .from("vendor-portfolios")
          .upload(target, image, { contentType: "image/webp", upsert: true });
        if (!uploadError)
          await adminClient
            .from("vendors")
            .update({ hero_image_path: target })
            .eq("id", data.vendor_id);
      }
    }
  }
  revalidatePath("/vendors/applications");
}
export async function scheduleInspection(formData: FormData) {
  const admin = await requireAdmin("vendors");
  const applicationId = uuid.parse(formData.get("applicationId"));
  const scheduledFor = z.coerce.date().parse(formData.get("scheduledFor"));
  const address = z.string().trim().min(5).max(300).parse(formData.get("address"));
  const client = createAdminClient();
  const { error } = await client.from("vendor_inspections").insert({
    application_id: applicationId,
    scheduled_for: scheduledFor.toISOString(),
    address,
    created_by: admin.id,
  });
  if (error) throw new Error("Could not schedule inspection");
  const { data: application } = await client
    .from("vendor_applications")
    .select("account_id,revision")
    .eq("id", applicationId)
    .single();
  const { data: owner } = application
    ? await client
        .from("vendor_memberships")
        .select("user_id")
        .eq("account_id", application.account_id)
        .eq("role", "owner")
        .single()
    : { data: null };
  if (owner)
    await client.from("vendor_notifications").upsert(
      {
        application_id: applicationId,
        recipient_id: owner.user_id,
        kind: "inspection",
        title: "Your MMEMME inspection is scheduled",
        body: `${scheduledFor.toLocaleString("en-NG")} · ${address}`,
        deduplication_key: `inspection:${applicationId}:${scheduledFor.toISOString()}`,
      },
      { onConflict: "deduplication_key" },
    );
  await client.from("admin_audit_events").insert({
    admin_id: admin.id,
    action: "vendor_inspection.scheduled",
    entity_type: "vendor_application",
    entity_id: applicationId,
    reason: "Physical operating-site inspection scheduled",
    correlation_id: crypto.randomUUID(),
  });
  revalidatePath("/vendors/applications");
}
export async function completeInspection(formData: FormData) {
  const admin = await requireAdmin("vendors");
  const inspectionId = uuid.parse(formData.get("inspectionId"));
  const applicationId = uuid.parse(formData.get("applicationId"));
  const outcome = z.enum(["passed", "failed", "follow_up"]).parse(formData.get("outcome"));
  const notes = z.string().trim().min(10).max(2000).parse(formData.get("notes"));
  const client = createAdminClient();
  const { error } = await client
    .from("vendor_inspections")
    .update({ outcome, notes, completed_at: new Date().toISOString() })
    .eq("id", inspectionId)
    .eq("application_id", applicationId);
  if (error) throw new Error("Could not record inspection");
  await client.from("admin_audit_events").insert({
    admin_id: admin.id,
    action: "vendor_inspection.completed",
    entity_type: "vendor_application",
    entity_id: applicationId,
    reason: `Inspection ${outcome}`,
    metadata: { inspectionId },
    correlation_id: crypto.randomUUID(),
  });
  revalidatePath("/vendors/applications");
}
export async function reviewProviderCheck(formData: FormData) {
  const admin = await requireAdmin("vendors");
  const checkId = uuid.parse(formData.get("checkId"));
  const applicationId = uuid.parse(formData.get("applicationId"));
  const decision = z.enum(["accept", "reject", "manual_review"]).parse(formData.get("decision"));
  const client = createAdminClient();
  const { error } = await client
    .from("vendor_provider_checks")
    .update({
      reviewer_decision: decision,
      reviewed_by: admin.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", checkId)
    .eq("application_id", applicationId);
  if (error) throw new Error("Could not record provider review");
  await client.from("admin_audit_events").insert({
    admin_id: admin.id,
    action: "vendor_provider_check.reviewed",
    entity_type: "vendor_application",
    entity_id: applicationId,
    reason: `Provider result marked ${decision}`,
    correlation_id: crypto.randomUUID(),
    metadata: { checkId, decision },
  });
  revalidatePath("/vendors/applications");
}
