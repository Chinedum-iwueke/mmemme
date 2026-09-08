import Link from "next/link";
import { createAdminClient, requireAdmin } from "../../lib/supabase/server";

export default async function DeliveryDiagnostics({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin("audit");
  const { status } = await searchParams;
  const client = createAdminClient();
  let query = client
    .from("notification_outbox")
    .select(
      "id,source_type,channel,status,attempts,next_attempt_at,provider_message_id,provider_receipt_status,last_error,created_at",
    )
    .order("created_at", { ascending: false })
    .limit(100);
  if (status) query = query.eq("status", status as never);
  const { data: rows } = await query;
  return (
    <main className="ops-page">
      <header className="ops-top">
        <div>
          <p className="eyebrow">Delivery operations</p>
          <h1>Notification diagnostics</h1>
        </div>
        <Link href="/">Dashboard</Link>
      </header>
      <section className="metrics">
        <div className="metric">
          <strong>{rows?.filter((row) => row.status === "sent").length ?? 0}</strong>
          <span>sent</span>
        </div>
        <div className="metric">
          <strong>{rows?.filter((row) => row.status === "retry").length ?? 0}</strong>
          <span>retrying</span>
        </div>
        <div className="metric">
          <strong>{rows?.filter((row) => row.status === "failed").length ?? 0}</strong>
          <span>failed</span>
        </div>
      </section>
      <form method="get" className="panel filter-form">
        <label>
          Status
          <select name="status" defaultValue={status ?? ""}>
            <option value="">All deliveries</option>
            <option value="pending">Pending</option>
            <option value="leased">Leased</option>
            <option value="retry">Retrying</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
            <option value="suppressed">Suppressed</option>
          </select>
        </label>
        <button className="secondary">Filter</button>
      </form>
      <section className="panel" style={{ marginTop: 18 }}>
        <h2>Latest attempts</h2>
        {rows?.map((row) => (
          <article className="request" key={row.id}>
            <div>
              <strong>
                {row.source_type.replaceAll("_", " ")} · {row.channel}
              </strong>
              <p>
                {row.status} · attempt {row.attempts} · next{" "}
                {new Date(row.next_attempt_at).toLocaleString("en-NG")}
              </p>
              <p>{row.last_error || row.provider_receipt_status || "No provider error"}</p>
            </div>
            <span className="pill">{new Date(row.created_at).toLocaleString("en-NG")}</span>
          </article>
        ))}
        {!rows?.length && <p className="empty">No delivery attempts in this queue.</p>}
      </section>
    </main>
  );
}
