import Link from "next/link";
import { createAdminClient, requireAdmin } from "../../lib/supabase/server";

export default async function OperationsSearch({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdmin("dashboard");
  const q = (await searchParams).q?.trim().slice(0, 120) ?? "";
  const client = createAdminClient();
  const isUuid = /^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(q);
  const safe = q.replace(/[,%()]/g, "");
  const [bookings, payments, vendors, applications, audit] = q
    ? await Promise.all([
        client
          .from("bookings")
          .select("id,correlation_id,status,event_date,vendors(name)")
          .or(isUuid ? `id.eq.${q},correlation_id.eq.${q}` : `requirements.ilike.%${safe}%`)
          .limit(20),
        client
          .from("payments")
          .select("id,booking_id,provider_reference,status,amount_kobo")
          .or(isUuid ? `id.eq.${q},booking_id.eq.${q}` : `provider_reference.ilike.%${safe}%`)
          .limit(20),
        client
          .from("vendors")
          .select("id,name,category,area,verification_status,published")
          .or(isUuid ? `id.eq.${q}` : `name.ilike.%${safe}%,area.ilike.%${safe}%`)
          .limit(20),
        client
          .from("vendor_applications")
          .select("id,account_id,status,updated_at")
          .or(isUuid ? `id.eq.${q},account_id.eq.${q}` : `status.eq.${safe}`)
          .limit(20),
        client
          .from("admin_audit_events")
          .select("id,action,entity_type,entity_id,correlation_id,created_at")
          .or(isUuid ? `entity_id.eq.${q},correlation_id.eq.${q}` : `action.ilike.%${safe}%`)
          .limit(20),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }, { data: [] }, { data: [] }];
  const groups = [
    ["Bookings", bookings.data, (item: Record<string, unknown>) => `/bookings?q=${item.id}`],
    ["Payments", payments.data, () => "/money"],
    ["Vendors", vendors.data, () => "/vendors"],
    ["Applications", applications.data, () => "/vendors/applications"],
    [
      "Audit events",
      audit.data,
      (item: Record<string, unknown>) => `/audit?q=${item.correlation_id}`,
    ],
  ] as const;
  return (
    <main className="ops-page">
      <header className="ops-top">
        <div>
          <p className="eyebrow">Global recovery</p>
          <h1>Search operations</h1>
        </div>
        <Link href="/">Dashboard</Link>
      </header>
      <form method="get" className="panel form">
        <label>
          Reference, correlation ID, vendor or case term
          <input
            name="q"
            defaultValue={q}
            autoFocus
            required
            placeholder="Booking UUID, Paystack reference, vendor name…"
          />
        </label>
        <button className="primary">Search all records</button>
      </form>
      {q && (
        <div className="search-results">
          {groups.map(([title, rows, href]) => (
            <section className="panel" key={title}>
              <h2>
                {title} <span className="pill">{rows?.length ?? 0}</span>
              </h2>
              {rows?.map((row) => (
                <Link
                  className="search-result"
                  href={href(row as Record<string, unknown>)}
                  key={String(row.id)}
                >
                  <strong>
                    {String(
                      (row as Record<string, unknown>).name ??
                        (row as Record<string, unknown>).action ??
                        row.id,
                    )}
                  </strong>
                  <code>{JSON.stringify(row)}</code>
                </Link>
              ))}
              {!rows?.length && <p className="empty">No matches.</p>}
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
