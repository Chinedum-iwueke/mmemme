"use server";
import { redirect } from "next/navigation";
import { requireCustomer } from "../../../lib/supabase/server";
export async function completeProfile(formData: FormData) {
  const next = String(formData.get("next") || "/bookings");
  const safe = next.startsWith("/") && !next.startsWith("//") ? next : "/bookings";
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  if (name.length < 2 || !email.includes("@"))
    redirect(`/auth/profile?error=invalid&next=${encodeURIComponent(safe)}`);
  const { client, user } = await requireCustomer(safe);
  const { error } = await client
    .from("profiles")
    .update({ full_name: name, email })
    .eq("id", user.id);
  if (error) redirect(`/auth/profile?error=save&next=${encodeURIComponent(safe)}`);
  redirect(safe);
}
