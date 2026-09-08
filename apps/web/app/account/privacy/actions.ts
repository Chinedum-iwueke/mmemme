"use server";
import { revalidatePath } from "next/cache";
import { requireCustomer } from "../../../lib/supabase/server";

export async function requestAccountData(formData: FormData) {
  const kind = String(formData.get("kind"));
  if (kind !== "export" && kind !== "deletion") return;
  const { client } = await requireCustomer("/account/privacy");
  await client.rpc("request_account_data", {
    p_kind: kind,
    p_reason: String(formData.get("reason") ?? ""),
  });
  revalidatePath("/account/privacy");
}

export async function updateAnalyticsConsent(formData: FormData) {
  const { client } = await requireCustomer("/account/privacy");
  await client.rpc("record_consent", {
    p_purpose: "analytics",
    p_policy_version: "privacy-2026-09",
    p_granted: formData.get("granted") === "true",
    p_source: "web",
  });
  revalidatePath("/account/privacy");
}
