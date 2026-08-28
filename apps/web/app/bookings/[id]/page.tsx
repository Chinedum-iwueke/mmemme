import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { presentStatus } from "@mmemme/domain";
import type { CancellationStatus, RefundStatus } from "@mmemme/domain";
import { money } from "../../../lib/marketplace";
import { requireCustomer } from "../../../lib/supabase/server";
import {
  acceptQuote,
  beginCheckout,
  confirmFulfillment,
  openDispute,
  requestCancellation,
  sendSupport,
  submitReview,
  uploadEvidence,
} from "./actions";
export const metadata: Metadata = {
  title: "Booking details",
  robots: { index: false, follow: false },
};
type CancellationPreview = {
  paidAmountKobo: number;
  refundableAmountKobo: number;
  retainedAmountKobo: number;
  daysBeforeEvent: number;
  refundPercent: number;
  policyVersion: string;
};
const date = (v: string) =>
  new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: v.includes("T") ? "short" : undefined,
  }).format(new Date(v));
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; error?: string }>;
}) {
  const { id } = await params,
    q = await searchParams;
  const { client, user } = await requireCustomer(`/bookings/${id}`);
  const { data: booking } = await client
    .from("bookings")
    .select("id,vendor_id,event_date,guest_count,requirements,status,created_at,correlation_id")
    .eq("id", id)
    .maybeSingle();
  if (!booking) notFound();
  const [
    { data: vendor },
    { data: quotes },
    { data: payments },
    { data: transitions },
    { data: messages },
    { data: cancellation },
    { data: refunds },
    { data: disputes },
    { data: review },
  ] = await Promise.all([
    client
      .from("vendors")
      .select("id,name,category,area")
      .eq("id", booking.vendor_id)
      .maybeSingle(),
    client
      .from("quotes")
      .select(
        "id,revision,total_amount_kobo,deposit_amount_kobo,expires_at,accepted_at,package_name_snapshot,inclusions,exclusions,payment_schedule,cancellation_summary,terms_version,created_at",
      )
      .eq("booking_id", id)
      .order("revision", { ascending: false }),
    client
      .from("payments")
      .select("id,provider_reference,amount_kobo,status,paid_at,created_at")
      .eq("booking_id", id)
      .order("created_at", { ascending: false }),
    client
      .from("state_transition_events")
      .select("id,new_state,reason,created_at")
      .eq("entity_type", "booking")
      .eq("entity_id", id)
      .order("created_at"),
    client
      .from("support_messages")
      .select("id,author_id,body,created_at")
      .eq("booking_id", id)
      .order("created_at"),
    client.from("cancellations").select("*").eq("booking_id", id).maybeSingle(),
    client
      .from("refunds")
      .select("*")
      .eq("booking_id", id)
      .order("created_at", { ascending: false }),
    client
      .from("disputes")
      .select("*")
      .eq("booking_id", id)
      .order("created_at", { ascending: false }),
    client.from("reviews").select("*").eq("booking_id", id).maybeSingle(),
  ]);
  const latest = quotes?.[0];
  const payment = payments?.[0];
  const status = presentStatus("booking", booking.status);
  let preview: CancellationPreview | null = null;
  if (["accepted_awaiting_payment", "confirmed", "service_due"].includes(booking.status)) {
    const result = await client.rpc("cancellation_preview", { p_booking_id: id });
    preview = result.data as CancellationPreview | null;
  }
  const activeDispute = disputes?.[0];
  const { data: evidence } = activeDispute
    ? await client
        .from("dispute_evidence")
        .select("id,description,media_type,created_at")
        .eq("dispute_id", activeDispute.id)
        .order("created_at")
    : { data: [] };
  const exception = ["declined", "expired", "cancelled", "disputed"].includes(booking.status);
  return (
    <main className="customer-page" id="main">
      <div className="shell booking-workspace">
        <section className="booking-main">
          <Link className="back-link" href="/bookings">
            ← All bookings
          </Link>
          {q.created && (
            <div className="success-banner" role="status">
              Your request was submitted once and is now with MMEMME operations.
            </div>
          )}
          {q.error && (
            <div className="form-alert" role="alert">
              That action could not be completed. The booking has been refreshed so you can see the
              current state and retry safely.
            </div>
          )}
          <header className="booking-heading">
            <span className={`customer-status ${status.tone}`}>{status.label}</span>
            <p className="eyebrow">
              {vendor?.category} · {vendor?.area}
            </p>
            <h1>{vendor?.name ?? "Wedding booking"}</h1>
            <p>{status.description}</p>
          </header>
          {exception && (
            <section className="rescue-card">
              <h2>What happens now</h2>
              <p>
                {booking.status === "disputed"
                  ? "MMEMME operations will review the booking record and evidence. Use support below for anything urgent."
                  : "This booking cannot continue in its current state. MMEMME support can explain the recorded reason and help with the next appropriate option."}
              </p>
              <a href="#support">Contact booking support</a>
            </section>
          )}
          <section className="workspace-card">
            <h2>Booking facts</h2>
            <dl className="fact-list">
              <div>
                <dt>Wedding date</dt>
                <dd>{date(booking.event_date)}</dd>
              </div>
              <div>
                <dt>Guests</dt>
                <dd>{booking.guest_count}</dd>
              </div>
              <div>
                <dt>Request</dt>
                <dd>{booking.requirements}</dd>
              </div>
              <div>
                <dt>Reference</dt>
                <dd>{booking.correlation_id.slice(0, 8).toUpperCase()}</dd>
              </div>
            </dl>
          </section>
          {latest && (
            <section className="workspace-card quote-card">
              <div className="card-heading">
                <div>
                  <p className="eyebrow">Quote revision {latest.revision}</p>
                  <h2>{latest.package_name_snapshot || "Confirmed service package"}</h2>
                </div>
                <span>
                  {new Date(latest.expires_at) > new Date()
                    ? `Expires ${date(latest.expires_at)}`
                    : "Expired"}
                </span>
              </div>
              <div className="money-grid">
                <p>
                  <span>Total</span>
                  <strong>{money(latest.total_amount_kobo)}</strong>
                </p>
                <p>
                  <span>Deposit due</span>
                  <strong>{money(latest.deposit_amount_kobo)}</strong>
                </p>
              </div>
              <p>
                <strong>Payment schedule:</strong> {latest.payment_schedule}
              </p>
              <div className="terms-grid">
                <div>
                  <h3>Included</h3>
                  <ul>
                    {latest.inclusions.map((v) => (
                      <li key={v}>{v}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3>Not included</h3>
                  <ul>
                    {latest.exclusions.map((v) => (
                      <li key={v}>{v}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="cancellation-callout">
                <strong>Cancellation consequences</strong>
                <p>{latest.cancellation_summary}</p>
                <small>Terms version {latest.terms_version}</small>
              </div>
              {booking.status === "quote_ready" && new Date(latest.expires_at) > new Date() && (
                <form action={acceptQuote}>
                  <input name="bookingId" type="hidden" value={id} />
                  <input name="quoteId" type="hidden" value={latest.id} />
                  <label className="acknowledgement">
                    <input required type="checkbox" />I accept this quote, payment schedule, terms
                    and cancellation consequences.
                  </label>
                  <button className="button primary">Accept this exact quote</button>
                </form>
              )}
              {booking.status === "quote_ready" && new Date(latest.expires_at) <= new Date() && (
                <p className="form-alert">
                  This quote expired. MMEMME must issue a current revision before you can accept or
                  pay.
                </p>
              )}
              {booking.status === "accepted_awaiting_payment" && (
                <form action={beginCheckout}>
                  <input name="bookingId" type="hidden" value={id} />
                  <input name="quoteId" type="hidden" value={latest.id} />
                  <button className="button primary">
                    Pay {money(latest.deposit_amount_kobo)} with Paystack
                  </button>
                  <p className="form-note">
                    Hosted checkout handles card details. Returning from checkout never confirms
                    payment by itself.
                  </p>
                </form>
              )}
            </section>
          )}
          {payment && (
            <section className="workspace-card receipt">
              <p className="eyebrow">Payment and receipt</p>
              <h2>{presentStatus("payment", payment.status).label}</h2>
              <dl className="fact-list">
                <div>
                  <dt>Amount</dt>
                  <dd>{money(payment.amount_kobo)}</dd>
                </div>
                <div>
                  <dt>Provider reference</dt>
                  <dd>{payment.provider_reference}</dd>
                </div>
                <div>
                  <dt>Authoritative paid time</dt>
                  <dd>{payment.paid_at ? date(payment.paid_at) : "Not confirmed"}</dd>
                </div>
              </dl>
              {payment.status === "pending" && (
                <p>
                  Paystack confirmation is still pending. Do not pay again unless this booking
                  offers the checkout action.
                </p>
              )}
            </section>
          )}
          <section className="workspace-card">
            <h2>Booking timeline</h2>
            <ol className="timeline">
              {transitions?.map((item) => {
                const state = presentStatus(
                  "booking",
                  item.new_state as Parameters<typeof presentStatus<"booking">>[1],
                );
                return (
                  <li key={item.id}>
                    <span />
                    <div>
                      <strong>{state.label}</strong>
                      <time>{date(item.created_at)}</time>
                      <p>{item.reason}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
          <section className="workspace-card" id="support">
            <h2>MMEMME booking support</h2>
            <div className="message-list">
              {messages?.map((message) => (
                <article
                  className={message.author_id === user.id ? "customer-message" : "support-message"}
                  key={message.id}
                >
                  <strong>{message.author_id === user.id ? "You" : "MMEMME support"}</strong>
                  <p>{message.body}</p>
                  <time>{date(message.created_at)}</time>
                </article>
              ))}
            </div>
            <form action={sendSupport}>
              <input name="bookingId" type="hidden" value={id} />
              <label>
                Message
                <textarea maxLength={3000} name="body" required rows={4} />
              </label>
              <button className="button secondary">Send to support</button>
            </form>
          </section>
        </section>
        <aside className="booking-sidebar">
          <section className="workspace-card">
            <h2>Next action</h2>
            <p>{status.description}</p>
            {booking.status === "requested" && (
              <p>Operations will claim the request and contact the vendor.</p>
            )}
            {booking.status === "operations_review" && (
              <p>MMEMME is confirming availability and final terms.</p>
            )}
            {booking.status === "confirmed" && (
              <p>Your receipt and support history remain here through fulfillment.</p>
            )}
          </section>
          {preview && !cancellation && (
            <section className="workspace-card">
              <h2>Cancellation preview</h2>
              <p>
                Based on the current beta policy and {preview.daysBeforeEvent} days before the
                event:
              </p>
              <dl className="fact-list">
                <div>
                  <dt>Estimated refund</dt>
                  <dd>{money(preview.refundableAmountKobo)}</dd>
                </div>
                <div>
                  <dt>Estimated retained</dt>
                  <dd>{money(preview.retainedAmountKobo)}</dd>
                </div>
              </dl>
              <details>
                <summary>Request cancellation</summary>
                <form action={requestCancellation}>
                  <input name="bookingId" type="hidden" value={id} />
                  <label>
                    Reason
                    <textarea minLength={10} name="reason" required />
                  </label>
                  <button className="button secondary">Submit request</button>
                </form>
              </details>
            </section>
          )}
          {cancellation && (
            <section className="workspace-card">
              <h2>Cancellation</h2>
              <span className="customer-status warning">
                {presentStatus("cancellation", cancellation.status as CancellationStatus).label}
              </span>
              <p>
                {
                  presentStatus("cancellation", cancellation.status as CancellationStatus)
                    .description
                }
              </p>
              <strong>Requested refund: {money(cancellation.refundable_amount_kobo)}</strong>
              {refunds?.map((refund) => (
                <p key={refund.id}>
                  Refund: {presentStatus("refund", refund.status as RefundStatus).label} ·{" "}
                  {money(refund.amount_kobo)}
                </p>
              ))}
            </section>
          )}
          {["confirmed", "service_due", "fulfilled"].includes(booking.status) && !activeDispute && (
            <section className="workspace-card">
              <h2>Report a serious problem</h2>
              <details>
                <summary>Open a dispute</summary>
                <form action={openDispute}>
                  <input name="bookingId" type="hidden" value={id} />
                  <label>
                    What happened?
                    <textarea minLength={20} name="reason" required />
                  </label>
                  <button className="button secondary">Open dispute</button>
                </form>
              </details>
            </section>
          )}
          {activeDispute && (
            <section className="workspace-card">
              <h2>Dispute</h2>
              <span className="customer-status error">
                {
                  presentStatus(
                    "dispute",
                    activeDispute.status as Parameters<typeof presentStatus<"dispute">>[1],
                  ).label
                }
              </span>
              <p>{activeDispute.reason}</p>
              <ul>
                {evidence?.map((item) => (
                  <li key={item.id}>
                    {item.description} · {date(item.created_at)}
                  </li>
                ))}
              </ul>
              {!activeDispute.resolved_at && (
                <form action={uploadEvidence}>
                  <input name="bookingId" type="hidden" value={id} />
                  <input name="disputeId" type="hidden" value={activeDispute.id} />
                  <label>
                    Evidence (JPG, PNG, WebP or PDF; 10 MB maximum)
                    <input
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      name="evidence"
                      required
                      type="file"
                    />
                  </label>
                  <button className="button secondary">Upload evidence</button>
                </form>
              )}
            </section>
          )}
          {booking.status === "service_due" && (
            <section className="workspace-card">
              <h2>Was the service delivered?</h2>
              <form action={confirmFulfillment}>
                <input name="bookingId" type="hidden" value={id} />
                <button className="button primary">Confirm fulfillment</button>
              </form>
            </section>
          )}
          {booking.status === "completed" && !review && (
            <section className="workspace-card">
              <h2>Leave a verified review</h2>
              <form action={submitReview}>
                <input name="bookingId" type="hidden" value={id} />
                <input name="vendorId" type="hidden" value={booking.vendor_id} />
                <label>
                  Rating
                  <select name="rating" required>
                    <option value="5">5 — Excellent</option>
                    <option value="4">4 — Good</option>
                    <option value="3">3 — Fair</option>
                    <option value="2">2 — Poor</option>
                    <option value="1">1 — Very poor</option>
                  </select>
                </label>
                <label>
                  Your review
                  <textarea minLength={20} name="body" required />
                </label>
                <button className="button primary">Submit verified review</button>
              </form>
            </section>
          )}
        </aside>
      </div>
    </main>
  );
}
