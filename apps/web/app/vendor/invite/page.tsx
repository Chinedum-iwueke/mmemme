import type { Metadata } from "next";
import { Suspense } from "react";
import { VendorInvitation } from "../../../components/vendor/vendor-invitation";
import "../vendor.css";
export const metadata: Metadata = { title: "Accept vendor invitation", robots: { index: false } };
export default function VendorInvitationPage() {
  return (
    <main id="main" className="vendor-page vendor-access-page">
      <Suspense fallback={<p className="vendor-status">Loading your secure invitation…</p>}>
        <VendorInvitation />
      </Suspense>
    </main>
  );
}
