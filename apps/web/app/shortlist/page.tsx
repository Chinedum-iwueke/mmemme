import type { Metadata } from "next";
import { ShortlistView } from "../../components/customer/shortlist-view";
export const metadata: Metadata = {
  title: "Your shortlist",
  robots: { index: false, follow: false },
};
export default function Page() {
  return (
    <main className="customer-page" id="main">
      <div className="shell">
        <header className="workspace-heading">
          <p className="eyebrow">Saved across devices</p>
          <h1>Your shortlist</h1>
          <p>Sign in to reconcile saved vendors with mobile and your other browsers.</p>
        </header>
        <ShortlistView />
      </div>
    </main>
  );
}
