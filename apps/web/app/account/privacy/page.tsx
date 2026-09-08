import type { Metadata } from "next";
import { requireCustomer } from "../../../lib/supabase/server";
import { requestAccountData, updateAnalyticsConsent } from "./actions";

export const metadata: Metadata = { title: "Privacy and your data", robots: { index: false } };

export default async function PrivacyPage() {
  const { client } = await requireCustomer("/account/privacy");
  const [{ data: requests }, { data: consents }] = await Promise.all([
    client
      .from("privacy_requests")
      .select("id,kind,status,requested_at,due_at")
      .order("requested_at", { ascending: false }),
    client
      .from("consent_records")
      .select("granted,recorded_at")
      .eq("purpose", "analytics")
      .order("recorded_at", { ascending: false })
      .limit(1),
  ]);
  const pending = requests?.some((item) => ["requested", "in_review"].includes(item.status));
  return (
    <main className="customer-page" id="main">
      <div className="shell">
        <header className="workspace-heading">
          <p className="eyebrow">Your information, your choice</p>
          <h1>Privacy and your data</h1>
          <p>
            Choose optional analytics, download a copy of your account data, or ask us to delete
            personal details we are not legally required to retain.
          </p>
        </header>
        <div className="booking-list">
          <section className="booking-list-card">
            <div>
              <h2>Optional product analytics</h2>
              <p>
                We only record approved, minimized product events. Payment details, messages and
                credentials are excluded.
              </p>
            </div>
            <p>
              Current choice: <strong>{consents?.[0]?.granted ? "Allowed" : "Not allowed"}</strong>
            </p>
            <div className="actions">
              <form action={updateAnalyticsConsent}>
                <input type="hidden" name="granted" value="true" />
                <button className="button primary">Allow analytics</button>
              </form>
              <form action={updateAnalyticsConsent}>
                <input type="hidden" name="granted" value="false" />
                <button className="button secondary">Decline analytics</button>
              </form>
            </div>
          </section>
          <section className="booking-list-card">
            <div>
              <h2>Export my data</h2>
              <p>
                Request a structured copy of your profile, briefs, bookings, payments, support
                messages and consent history.
              </p>
            </div>
            <form action={requestAccountData}>
              <input type="hidden" name="kind" value="export" />
              <button className="button primary" disabled={pending}>
                Request export
              </button>
            </form>
          </section>
          <section className="booking-list-card">
            <div>
              <h2>Delete my account data</h2>
              <p>
                Personal details and convenience data are removed. Booking, payment, ledger and
                audit records are retained in pseudonymized form where required.
              </p>
            </div>
            <form action={requestAccountData}>
              <input type="hidden" name="kind" value="deletion" />
              <label htmlFor="reason">Anything we should know?</label>
              <textarea id="reason" name="reason" maxLength={500} />
              <button className="button secondary" disabled={pending}>
                Request deletion
              </button>
            </form>
          </section>
        </div>
        <section className="workspace-heading">
          <h2>Request history</h2>
          {requests?.length ? (
            requests.map((item) => (
              <p key={item.id}>
                <strong>{item.kind}</strong> · {item.status} · due{" "}
                {new Intl.DateTimeFormat("en-NG").format(new Date(item.due_at))}
              </p>
            ))
          ) : (
            <p>No privacy requests yet.</p>
          )}
        </section>
      </div>
    </main>
  );
}
