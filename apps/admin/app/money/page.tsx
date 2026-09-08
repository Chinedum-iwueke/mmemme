import Link from "next/link";
import { createAdminClient, requireAdmin } from "../../lib/supabase/server";
import { resolveReconciliationException, runReconciliation } from "../safety/actions";
import "./money.css";

const money = (k: number) => `₦${Math.round(k / 100).toLocaleString("en-NG")}`;
export default async function MoneyPage() {
  await requireAdmin("money");
  const client = createAdminClient();
  const [
    { data: payments },
    { data: entries },
    { data: payouts },
    { data: refunds },
    { data: exceptions },
    { data: alerts },
  ] = await Promise.all([
    client
      .from("payments")
      .select("id,booking_id,provider_reference,amount_kobo,status,paid_at,created_at")
      .order("created_at", { ascending: false }),
    client.from("ledger_entries").select("payment_id,entry_type,amount_kobo,idempotency_key"),
    client.from("payouts").select("id,payment_id,amount_kobo,status,provider_reference"),
    client
      .from("refunds")
      .select("id,payment_id,amount_kobo,status,provider_reference,failure_reason"),
    client
      .from("reconciliation_exceptions")
      .select("id,payment_id,kind,expected_kobo,actual_kobo,status,resolution,created_at")
      .order("created_at", { ascending: false }),
    client
      .from("financial_alerts")
      .select("id,severity,kind,summary,status,assigned_to,created_at")
      .order("created_at", { ascending: false })
      .limit(50),
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
        <Link href="/exports?scope=money">Download redacted CSV</Link>
      </header>
      <div className="gate">
        <strong>Sandbox ledger</strong>No live-money capability is enabled by this screen.
        Production remains behind the commercial and legal launch gates.
      </div>
      <section className="money-metrics" aria-label="Money controls summary">
        <div>
          <strong>
            {rows.filter((row) => row.p.status === "succeeded" && !row.balanced).length}
          </strong>
          <span>ledger exceptions</span>
        </div>
        <div>
          <strong>
            {refunds?.filter((item) => item.status.includes("awaiting") || item.status === "failed")
              .length ?? 0}
          </strong>
          <span>refund actions</span>
        </div>
        <div>
          <strong>
            {payouts?.filter((item) => ["held", "failed"].includes(item.status)).length ?? 0}
          </strong>
          <span>payout actions</span>
        </div>
        <form action={runReconciliation}>
          <button className="primary">Run reconciliation</button>
        </form>
      </section>
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
      <div className="money-columns">
        <section className="panel">
          <h2>Refund and payout state</h2>
          {refunds?.map((refund) => (
            <article className="money-case" key={refund.id}>
              <div>
                <strong>Refund {money(refund.amount_kobo)}</strong>
                <p>
                  Payment {refund.payment_id.slice(0, 8)} ·{" "}
                  {refund.provider_reference ?? "provider pending"}
                </p>
              </div>
              <span className={`status ${refund.status}`}>
                {refund.status.replaceAll("_", " ")}
              </span>
              {refund.failure_reason && <p className="exception">{refund.failure_reason}</p>}
            </article>
          ))}
          {payouts?.map((payout) => (
            <article className="money-case" key={payout.id}>
              <div>
                <strong>Payout {money(payout.amount_kobo)}</strong>
                <p>{payout.provider_reference ?? "provider reference pending"}</p>
              </div>
              <span className={`status ${payout.status}`}>{payout.status}</span>
            </article>
          ))}
        </section>
        <section className="panel">
          <h2>Reconciliation exceptions</h2>
          {exceptions?.map((item) => (
            <article className="money-case" key={item.id}>
              <div>
                <strong>{item.kind.replaceAll("_", " ")}</strong>
                <p>
                  Expected {money(item.expected_kobo ?? 0)} · actual {money(item.actual_kobo ?? 0)}
                </p>
              </div>
              <span className={`status ${item.status}`}>{item.status}</span>
              {item.status !== "resolved" ? (
                <form action={resolveReconciliationException} className="form compact-resolution">
                  <input type="hidden" name="exceptionId" value={item.id} />
                  <label>
                    Compensating-action record
                    <input
                      name="reason"
                      required
                      minLength={10}
                      placeholder="Explain the verified correction"
                    />
                  </label>
                  <label className="attest">
                    <input type="checkbox" name="confirmed" value="yes" required /> I verified the
                    correction without mutating ledger history.
                  </label>
                  <button className="secondary">Resolve with audit</button>
                </form>
              ) : (
                <p>{item.resolution}</p>
              )}
            </article>
          ))}
          {!exceptions?.length && <p className="empty">No recorded reconciliation exceptions.</p>}
        </section>
        <section className="panel">
          <h2>Financial alerts</h2>
          {alerts?.map((alert) => (
            <article className="money-case" key={alert.id}>
              <div>
                <strong>
                  {alert.severity} · {alert.kind}
                </strong>
                <p>{alert.summary}</p>
                <p>
                  Owner {alert.assigned_to?.slice(0, 8) ?? "unassigned"} ·{" "}
                  {new Date(alert.created_at).toLocaleString("en-NG")}
                </p>
              </div>
              <span className={`status ${alert.status}`}>{alert.status}</span>
            </article>
          ))}
          {!alerts?.length && <p className="empty">No active financial alerts.</p>}
        </section>
      </div>
    </div>
  );
}
