import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { serverClient } from "../../../lib/supabase/server";
import { VendorWorkspace } from "../../../components/vendor/vendor-workspace";
import "../vendor.css";

export const metadata: Metadata = { title: "Vendor workspace", robots: { index: false } };
export default async function VendorWorkspacePage() {
  const client = await serverClient();
  const { data: auth } = await client.auth.getUser();
  if (!auth.user) redirect(`/vendor/apply?next=${encodeURIComponent("/vendor/workspace")}`);
  const { data: membership } = await client
    .from("vendor_memberships")
    .select("account_id,role")
    .eq("user_id", auth.user.id)
    .limit(1)
    .maybeSingle();
  if (!membership) redirect("/vendor/apply");
  return (
    <main id="main" className="vendor-page">
      <VendorWorkspace
        userId={auth.user.id}
        accountId={membership.account_id}
        role={membership.role}
      />
    </main>
  );
}
