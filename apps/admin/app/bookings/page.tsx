import Link from "next/link";
import { addContactNote, claimRequest, declineRequest, expireQuote, issueQuote } from "./actions";
import { createAdminClient, requireAdmin } from "../../lib/supabase/server";
import { AssignmentForm } from "../operations/assignment-form";
import { saveQueue } from "../operations/actions";
import "./bookings.css";

const money = (k: number) => `₦${Math.round(k / 100).toLocaleString("en-NG")}`;
export default async function BookingQueue({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  await requireAdmin("bookings");
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const pageSize = 20;
  const client = createAdminClient();
  let bookingQuery = client
    .from("bookings")
    .select(
      "id,customer_id,vendor_id,event_date,guest_count,requirements,status,created_at,correlation_id,revision",
    )
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);
  if (params.status) bookingQuery = bookingQuery.eq("status", params.status as never);
  const [
    { data: bookings },
    { data: vendors },
    { data: profiles },
    { data: quotes },
    { data: notes },
    { data: assignments },
    { data: admins },
  ] = await Promise.all([
    bookingQuery,
    client.from("vendors").select("id,name"),
    client.from("profiles").select("id,full_name,phone,email"),
    client
      .from("quotes")
      .select("id,booking_id,revision,deposit_amount_kobo,expires_at")
      .order("revision", { ascending: false }),
    client
      .from("booking_operations_notes")
      .select("booking_id,note_type,body,created_at")
      .order("created_at", { ascending: false }),
    client
      .from("operations_assignments")
      .select("entity_id,assigned_to,priority,due_at")
      .eq("entity_type", "booking"),
    client
      .from("admin_access")
      .select("user_id,profiles!admin_access_user_id_fkey(full_name)")
      .eq("active", true)
      .is("revoked_at", null),
  ]);
  return (
    <div className="ops-page">
      <header className="ops-top">
        <div>
          <p className="eyebrow">Transaction operations</p>
          <h1>Booking requests</h1>
        </div>
        <Link href="/">Dashboard</Link>
        <Link href="/exports?scope=bookings">Download redacted CSV</Link>
      </header>
      <section className="panel queue-controls" aria-label="Queue controls">
        <form method="get" className="filter-form">
          <label>
            Status{" "}
            <select name="status" defaultValue={params.status ?? ""}>
              <option value="">All bookings</option>
              <option value="requested">New requests</option>
              <option value="operations_review">Operations review</option>
              <option value="quote_ready">Quote ready</option>
              <option value="confirmed">Confirmed</option>
              <option value="disputed">Disputed</option>
            </select>
          </label>
          <button className="secondary">Apply</button>
        </form>
        <form action={saveQueue} className="filter-form">
          <input type="hidden" name="scope" value="bookings" />
          <input type="hidden" name="status" value={params.status ?? ""} />
          <label>
            Queue name <input name="name" required minLength={2} placeholder="My urgent requests" />
          </label>
          <button className="secondary">Save view</button>
        </form>
      </section>
      <div className="queue">
        {bookings?.map((b) => {
          const customer = profiles?.find((p) => p.id === b.customer_id);
          const vendor = vendors?.find((v) => v.id === b.vendor_id);
          const latest = quotes?.find((q) => q.booking_id === b.id);
          const assignment = assignments?.find((item) => item.entity_id === b.id);
          const history = notes?.filter((item) => item.booking_id === b.id) ?? [];
          return (
            <article className="booking-card" key={b.id}>
              <div className="booking-head">
                <div>
                  <span className={`status ${b.status}`}>{b.status.replaceAll("_", " ")}</span>
                  <h2>
                    {customer?.full_name ?? "Customer"} → {vendor?.name ?? "Vendor"}
                  </h2>
                  <p>
                    {b.event_date} · {b.guest_count} guests · {customer?.phone ?? customer?.email}
                  </p>
                </div>
                {latest && (
                  <div className="quote-chip">
                    <strong>{money(latest.deposit_amount_kobo)}</strong>
                    <span>deposit · rev {latest.revision}</span>
                  </div>
                )}
              </div>
              <p className="requirements">{b.requirements}</p>
              <AssignmentForm
                entityType="booking"
                entityId={b.id}
                correlationId={b.correlation_id}
                admins={(admins ?? []) as never}
                current={assignment}
              />
              <details>
                <summary>Activity history ({history.length})</summary>
                {history.map((item) => (
                  <p className="history-row" key={`${item.created_at}:${item.note_type}`}>
                    <strong>{item.note_type.replaceAll("_", " ")}</strong> · {item.body} ·{" "}
                    {new Date(item.created_at).toLocaleString("en-NG")}
                  </p>
                ))}
              </details>
              {b.status === "requested" && (
                <form action={claimRequest}>
                  <input type="hidden" name="bookingId" value={b.id} />
                  <button className="primary">Claim and review</button>
                </form>
              )}
              {["operations_review", "quote_ready"].includes(b.status) && (
                <details>
                  <summary>Vendor contact and quote</summary>
                  <form action={addContactNote} className="form inline-form">
                    <input type="hidden" name="bookingId" value={b.id} />
                    <input type="hidden" name="expectedRevision" value={b.revision} />
                    <label>
                      Contact attempt
                      <input
                        name="body"
                        required
                        placeholder="Called vendor; date held until 4pm"
                      />
                    </label>
                    <button className="secondary">Record contact</button>
                  </form>
                  <form action={issueQuote} className="form quote-form">
                    <input type="hidden" name="bookingId" value={b.id} />
                    <label>
                      Total (₦)
                      <input name="totalNaira" type="number" min="1" required />
                    </label>
                    <label>
                      Deposit (₦)
                      <input name="depositNaira" type="number" min="1" required />
                    </label>
                    <label>
                      Expires
                      <input name="expiresAt" type="datetime-local" required />
                    </label>
                    <label>
                      Payment schedule
                      <input
                        name="paymentSchedule"
                        required
                        placeholder="50% now; balance 30 days before"
                      />
                    </label>
                    <label>
                      Inclusions
                      <textarea name="inclusions" rows={4} placeholder="One item per line" />
                    </label>
                    <label>
                      Exclusions
                      <textarea name="exclusions" rows={4} placeholder="One item per line" />
                    </label>
                    <label className="wide">
                      Cancellation consequences
                      <textarea name="cancellationSummary" minLength={20} rows={4} required />
                    </label>
                    <label className="attest wide">
                      <input type="checkbox" name="availabilityConfirmed" value="yes" required /> I
                      confirmed this date, package and price directly with the vendor.
                    </label>
                    <button className="primary wide">
                      {b.status === "quote_ready" ? "Issue revised quote" : "Issue quote"}
                    </button>
                    <p className="notification-preview wide">
                      <strong>Customer notification preview:</strong> Your MMEMME quote is ready.
                      Open booking {b.id.slice(0, 8)} to review the complete price, expiry and
                      cancellation terms.
                    </p>
                  </form>
                </details>
              )}
              {["requested", "operations_review"].includes(b.status) && (
                <form action={declineRequest} className="form decline-form">
                  <input type="hidden" name="bookingId" value={b.id} />
                  <label>
                    Decline reason
                    <input name="reason" minLength={5} required />
                  </label>
                  <button className="secondary">Decline request</button>
                </form>
              )}
              {b.status === "quote_ready" && (
                <form action={expireQuote} className="form decline-form">
                  <input type="hidden" name="bookingId" value={b.id} />
                  <label>
                    Expiry reason
                    <input
                      name="reason"
                      required
                      minLength={5}
                      defaultValue="Vendor availability window closed"
                    />
                  </label>
                  <label className="attest">
                    <input type="checkbox" name="confirmed" value="yes" required /> Notify the
                    customer that this quote can no longer be accepted.
                  </label>
                  <button className="secondary">Expire current quote</button>
                </form>
              )}
            </article>
          );
        })}
        {!bookings?.length && <div className="panel empty">No booking requests yet.</div>}
      </div>
      <nav className="pagination" aria-label="Booking pages">
        {page > 1 && (
          <Link href={`/bookings?status=${params.status ?? ""}&page=${page - 1}`}>Previous</Link>
        )}
        <span>Page {page}</span>
        {(bookings?.length ?? 0) === pageSize && (
          <Link href={`/bookings?status=${params.status ?? ""}&page=${page + 1}`}>Next</Link>
        )}
      </nav>
    </div>
  );
}
