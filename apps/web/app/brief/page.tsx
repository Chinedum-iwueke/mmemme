import type { Metadata } from "next";
import { Suspense } from "react";
import { BriefForm } from "../../components/customer/brief-form";
export const metadata: Metadata = {
  title: "Your wedding brief",
  robots: { index: false, follow: false },
};
export default function Page() {
  return (
    <main className="customer-page" id="main">
      <div className="shell">
        <Suspense fallback={<p>Restoring your brief…</p>}>
          <BriefForm />
        </Suspense>
      </div>
    </main>
  );
}
