import Link from "next/link";
import { createAdminClient, requireAdmin } from "../../lib/supabase/server";
import {
  approvePayoutEligibility,
  approveRefund,
  decideCancellation,
  executeRefund,
  replySupport,
  resolveDispute,
  runReconciliation,
  transitionFulfillment,
} from "./actions";
import "./safety.css";
const money = (k: number) => `₦${Math.round(k / 100).toLocaleString("en-NG")}`;
export default async function SafetyPage() {
  await requireAdmin();
  const c = createAdminClient();
  const [
    { data: messages },
    { data: cancellations },
    { data: refunds },
    { data: disputes },
    { data: bookings },
    { data: payouts },
    { data: runs },
  ] = await Promise.all([
    c
      .from("support_messages")
      .select("id,booking_id,author_id,body,created_at")
      .order("created_at", { ascending: false }),
    c
      .from("cancellations")
      .select("*")
      .order("requested_at", { ascending: false }),
    c.from("refunds").select("*").order("created_at", { ascending: false }),
    c.from("disputes").select("*").order("created_at", { ascending: false }),
    c.from("bookings").select("id,status,correlation_id,event_date"),
    c
      .from("payouts")
      .select("id,booking_id,amount_kobo,status")
      .order("created_at", { ascending: false }),
    c
      .from("reconciliation_runs")
      .select("*")
      .order("run_date", { ascending: false })
      .limit(7),
  ]);
  return (
    <div className="ops-page">
      <header className="ops-top">
        <div>
          <p className="eyebrow">Beta safety</p>
          <h1>Support, disputes and funds</h1>
        </div>
        <Link href="/">Dashboard</Link>
      </header>
      <div className="safety-grid">
        <Section title="Support queue">
          {messages?.slice(0, 20).map((m) => (
            <article className="case" key={m.id}>
              <strong>{m.body}</strong>
              <small>
                Booking {m.booking_id.slice(0, 8)} ·{" "}
                {new Date(m.created_at).toLocaleString()}
              </small>
              <form action={replySupport} className="form inline-form">
                <input type="hidden" name="bookingId" value={m.booking_id} />
                <label>
                  Reply
                  <input name="body" required minLength={2} />
                </label>
                <button className="secondary">Send</button>
              </form>
            </article>
          ))}
        </Section>
        <Section title="Cancellation and refund queue">
          {cancellations?.map((x) => (
            <article className="case" key={x.id}>
              <span className={`status ${x.status}`}>{x.status}</span>
              <strong>{x.reason}</strong>
              <small>
                Refund preview {money(x.refundable_amount_kobo)} · retained{" "}
                {money(x.retained_amount_kobo)}
              </small>
              {x.status === "requested" && (
                <form action={decideCancellation} className="form">
                  <input type="hidden" name="cancellationId" value={x.id} />
                  <label>
                    Decision reason
                    <input name="reason" required minLength={5} />
                  </label>
                  <div className="buttons">
                    <button className="primary" name="decision" value="approve">
                      Approve cancellation
                    </button>
                    <button
                      className="secondary"
                      name="decision"
                      value="reject"
                    >
                      Reject
                    </button>
                  </div>
                </form>
              )}
              {refunds
                ?.filter((r) => r.cancellation_id === x.id)
                .map((r) => (
                  <form action={approveRefund} className="refund" key={r.id}>
                    <span className="status">
                      {r.status.replaceAll("_", " ")}
                    </span>
                    <strong>{money(r.amount_kobo)}</strong>
                    {r.status.startsWith("awaiting_") && (
                      <>
                        <input type="hidden" name="refundId" value={r.id} />
                        <input
                          name="reason"
                          required
                          minLength={5}
                          placeholder="Approval reason"
                        />
                        <button className="secondary">
                          {r.status === "awaiting_first_approval"
                            ? "First approval"
                            : "Second approval"}
                        </button>
                      </>
                    )}
                    {r.status === "approved" && (
                      <>
                        <input type="hidden" name="refundId" value={r.id} />
                        <button className="primary" formAction={executeRefund}>
                          Send approved refund
                        </button>
                      </>
                    )}
                  </form>
                ))}
            </article>
          ))}
        </Section>
        <Section title="Disputes">
          {disputes?.map((d) => (
            <article className="case" key={d.id}>
              <span className="status">{d.status}</span>
              <strong>{d.reason}</strong>
              {["open", "investigating"].includes(d.status) && (
                <form action={resolveDispute} className="form">
                  <input type="hidden" name="disputeId" value={d.id} />
                  <label>
                    Resolution
                    <select name="outcome">
                      <option value="resolved_customer">
                        Resolve for customer
                      </option>
                      <option value="resolved_vendor">
                        Resolve for vendor
                      </option>
                      <option value="closed">Close</option>
                    </select>
                  </label>
                  <label>
                    Resolution note
                    <input name="reason" minLength={5} required />
                  </label>
                  <button className="secondary">Record resolution</button>
                </form>
              )}
            </article>
          ))}
        </Section>
        <Section title="Fulfillment and payout eligibility">
          {bookings
            ?.filter((b) => ["confirmed", "fulfilled"].includes(b.status))
            .map((b) => (
              <article className="case" key={b.id}>
                <strong>
                  {b.status.replaceAll("_", " ")} · {b.event_date}
                </strong>
                <small>Correlation {b.correlation_id}</small>
                <form
                  action={transitionFulfillment}
                  className="form inline-form"
                >
                  <input type="hidden" name="bookingId" value={b.id} />
                  <input
                    type="hidden"
                    name="next"
                    value={
                      b.status === "confirmed" ? "service_due" : "completed"
                    }
                  />
                  <label>
                    Reason
                    <input
                      name="reason"
                      required
                      minLength={5}
                      defaultValue={
                        b.status === "confirmed"
                          ? "Event date reached"
                          : "Fulfillment verified"
                      }
                    />
                  </label>
                  <button className="secondary">
                    Mark{" "}
                    {b.status === "confirmed" ? "service due" : "completed"}
                  </button>
                </form>
              </article>
            ))}
          {payouts
            ?.filter((p) => p.status === "held")
            .map((p) => (
              <form
                action={approvePayoutEligibility}
                className="case form"
                key={p.id}
              >
                <span className="status">held payout</span>
                <strong>{money(p.amount_kobo)}</strong>
                <input type="hidden" name="payoutId" value={p.id} />
                <label>
                  Approval reason
                  <input name="reason" minLength={5} required />
                </label>
                <button className="secondary">Approve eligibility</button>
              </form>
            ))}
        </Section>
        <Section title="Daily reconciliation">
          <form action={runReconciliation}>
            <button className="primary">Run reconciliation now</button>
          </form>
          {runs?.map((r) => (
            <article className="case" key={r.id}>
              <span className={`status ${r.status}`}>{r.status}</span>
              <strong>{r.run_date}</strong>
              <small>
                {r.payment_count} payments · {r.exception_count} unresolved fund
                exceptions
              </small>
            </article>
          ))}
        </Section>
      </div>
    </div>
  );
}
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="panel safety-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}
