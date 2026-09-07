import Link from "next/link";
import { createAdminClient, requireAdmin } from "../../lib/supabase/server";
import "./money.css";

const money = (k: number) => `₦${Math.round(k / 100).toLocaleString("en-NG")}`;
export default async function MoneyPage() {
  await requireAdmin();
  const client = createAdminClient();
  const [{ data: payments }, { data: entries }, { data: payouts }] = await Promise.all([
    client
      .from("payments")
      .select("id,booking_id,provider_reference,amount_kobo,status,paid_at,created_at")
      .order("created_at", { ascending: false }),
    client.from("ledger_entries").select("payment_id,entry_type,amount_kobo,idempotency_key"),
    client.from("payouts").select("id,payment_id,amount_kobo,status,provider_reference"),
  ]);
  const rows =
    payments?.map((p) => {
      const ledger = entries?.filter((e) => e.payment_id === p.id) ?? [];
      const gross = ledger.find((e) => e.entry_type === "gross")?.amount_kobo ?? 0;
      const fee = ledger.find((e) => e.entry_type === "platform_fee")?.amount_kobo ?? 0;
      const net = ledger.find((e) => e.entry_type === "vendor_net")?.amount_kobo ?? 0;
      return {
        p,
        gross,
        fee,
        net,
        balanced: gross > 0 && gross === fee + net,
        payout: payouts?.find((o) => o.payment_id === p.id),
      };
    }) ?? [];
  return (
    <div className="ops-page">
      <header className="ops-top">
        <div>
          <p className="eyebrow">Finance operations</p>
          <h1>Money and reconciliation</h1>
        </div>
        <Link href="/">Dashboard</Link>
      </header>
      <div className="gate">
        <strong>Sandbox ledger</strong>No live-money capability is enabled by this screen.
        Production remains behind the commercial and legal launch gates.
      </div>
      <section className="panel" style={{ marginTop: 18 }}>
        <h2>Payment ledger</h2>
        <div className="money-table">
          <div className="money-row money-head">
            <span>Reference</span>
            <span>Status</span>
            <span>Gross</span>
            <span>MMEMME fee</span>
            <span>Vendor net</span>
            <span>Payout</span>
            <span>Check</span>
          </div>
          {rows.map(({ p, gross, fee, net, balanced, payout }) => (
            <div className="money-row" key={p.id}>
              <span>{p.provider_reference}</span>
              <span className={`status ${p.status}`}>{p.status}</span>
              <span>{money(gross || p.amount_kobo)}</span>
              <span>{fee ? money(fee) : "—"}</span>
              <span>{net ? money(net) : "—"}</span>
              <span>{payout?.status ?? "—"}</span>
              <span className={balanced ? "reconciled" : "exception"}>
                {balanced ? "Balanced" : p.status === "succeeded" ? "Exception" : "Pending"}
              </span>
            </div>
          ))}
          {!rows.length && <p className="empty">No payment attempts yet.</p>}
        </div>
      </section>
    </div>
  );
}
