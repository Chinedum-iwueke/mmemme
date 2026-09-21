import type { Metadata } from "next";
import { requireCustomer } from "../../../lib/supabase/server";
import { IdentityVerification } from "../../../components/customer/identity-verification";

export const metadata: Metadata = { title: "Verify your identity", robots: { index: false } };

export default async function AccountVerificationPage() {
  const { client, user } = await requireCustomer("/account/verification");
  const [{ data }, { data: membership }] = await Promise.all([
    client
      .from("account_identity_verifications")
      .select(
        "status,email_verified_at,national_identity_verified_at,document_verified_at,selfie_liveness_verified_at,face_match_verified_at,checked_at,expires_at",
      )
      .eq("user_id", user.id)
      .maybeSingle(),
    client
      .from("vendor_memberships")
      .select("account_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle(),
  ]);
  const { data: vendorApplication } = membership
    ? await client
        .from("vendor_applications")
        .select("id")
        .eq("account_id", membership.account_id)
        .maybeSingle()
    : { data: null };
  return (
    <main className="customer-page" id="main">
      <div className="shell">
        <header className="workspace-heading">
          <p className="eyebrow">Optional marketplace trust</p>
          <h1>Verify your identity</h1>
          <p>
            Verified customers can give vendors more confidence in genuine booking requests.
            Verification is not a guarantee of conduct, payment or event fulfilment.
          </p>
        </header>
        <IdentityVerification
          initial={data}
          initialEmail={user.email ?? ""}
          vendorApplicationId={vendorApplication?.id ?? null}
        />
      </div>
    </main>
  );
}
