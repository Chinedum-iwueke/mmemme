"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient, requireAdmin } from "../../lib/supabase/server";

const uuid = z.string().uuid();
async function owner() {
  const admin = await requireAdmin("audit");
  if (admin.adminRole !== "owner") throw new Error("Only an operations owner can manage access");
  return admin;
}
export async function grantOperatorAccess(form: FormData) {
  const admin = await owner();
  const userId = uuid.parse(form.get("userId"));
  const role = z
    .enum(["owner", "operations", "verification", "support", "finance", "auditor"])
    .parse(form.get("role"));
  const timeout = z.coerce.number().int().min(5).max(480).parse(form.get("timeout"));
  const client = createAdminClient();
  const { error } = await client.from("admin_access").upsert({
    user_id: userId,
    role,
    active: true,
    revoked_at: null,
    revoked_by: null,
    session_timeout_minutes: timeout,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error("Could not grant operator access");
  await client.from("profiles").update({ is_admin: true }).eq("id", userId);
  await client.from("admin_audit_events").insert({
    admin_id: admin.id,
    action: "admin_access.granted",
    entity_type: "admin_access",
    entity_id: userId,
    reason: `Granted ${role} role`,
    correlation_id: crypto.randomUUID(),
    metadata: { role, timeout },
  });
  revalidatePath("/access");
}
export async function revokeOperatorAccess(form: FormData) {
  const admin = await owner();
  const userId = uuid.parse(form.get("userId"));
  if (userId === admin.id) throw new Error("You cannot revoke your own active session");
  const reason = z.string().trim().min(10).max(500).parse(form.get("reason"));
  const client = createAdminClient();
  const { error } = await client
    .from("admin_access")
    .update({
      active: false,
      revoked_at: new Date().toISOString(),
      revoked_by: admin.id,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);
  if (error) throw new Error("Could not revoke access");
  await client.from("profiles").update({ is_admin: false }).eq("id", userId);
  await client.from("admin_audit_events").insert({
    admin_id: admin.id,
    action: "admin_access.revoked",
    entity_type: "admin_access",
    entity_id: userId,
    reason,
    correlation_id: crypto.randomUUID(),
  });
  revalidatePath("/access");
}
