"use server";
import { revalidatePath } from "next/cache";
import { createClient, requireAdmin } from "../../lib/supabase/server";

export async function completePrivacyRequest(formData: FormData) {
  await requireAdmin("audit");
  const client = await createClient();
  await client.rpc("complete_privacy_request", {
    p_request_id: String(formData.get("requestId")),
    p_approve: formData.get("decision") === "approve",
    p_reason: String(formData.get("reason") ?? "Reviewed under the MMEMME privacy runbook."),
  });
  revalidatePath("/privacy");
}
