import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { serverClient } from "../../../lib/supabase/server";
import { VendorAccess } from "../../../components/vendor/vendor-access";
import "../vendor.css";

export const metadata: Metadata = { title: "Apply as a wedding vendor", robots: { index: false } };
export default async function VendorApplyPage() {
  const client = await serverClient();
  const { data: auth } = await client.auth.getUser();
  if (auth.user) {
    const { data: membership } = await client
      .from("vendor_memberships")
      .select("account_id")
      .eq("user_id", auth.user.id)
      .maybeSingle();
    if (membership) redirect("/vendor/workspace");
  }
  return (
    <main id="main" className="vendor-page vendor-access-page">
      <VendorAccess initialEmail={auth.user?.email ?? ""} authenticated={Boolean(auth.user)} />
    </main>
  );
}
