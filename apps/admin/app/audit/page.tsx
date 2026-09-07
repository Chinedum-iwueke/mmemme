import Link from "next/link";
import { createAdminClient, requireAdmin } from "../../lib/supabase/server";
export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdmin("audit");
  const q = (await searchParams).q?.trim() ?? "";
  const client = createAdminClient();
  let audit = client
    .from("admin_audit_events")
    .select("id,admin_id,action,entity_type,entity_id,reason,metadata,correlation_id,created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  if (q) audit = audit.or(`correlation_id.eq.${q},entity_id.eq.${q}`);
  const [{ data: events }, { data: transitions }] = await Promise.all([
    audit,
    client
      .from("state_transition_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);
  return (
    <div className="ops-page">
      <header className="ops-top">
        <div>
          <p className="eyebrow">Attribution and recovery</p>
          <h1>Audit and correlation search</h1>
        </div>
        <Link href="/">Dashboard</Link>
        <Link href="/search">Global search</Link>
      </header>
      <form className="panel form" method="get">
        <label>
          Correlation or entity UUID
          <input name="q" defaultValue={q} placeholder="Paste a full UUID" />
        </label>
        <button className="primary">Search</button>
      </form>
      <section className="panel" style={{ marginTop: 18 }}>
        <h2>Admin actions</h2>
        {events?.map((e) => (
          <article className="request" key={e.id}>
            <div>
              <strong>{e.action}</strong>
              <p>
                {e.reason} · {e.entity_type} {e.entity_id}
              </p>
              <p>Correlation {e.correlation_id}</p>
            </div>
            <span className="pill">{new Date(e.created_at).toLocaleString()}</span>
          </article>
        ))}
      </section>
      {!q && (
        <section className="panel" style={{ marginTop: 18 }}>
          <h2>State transitions</h2>
          {transitions?.map((t) => (
            <article className="request" key={t.id}>
              <div>
                <strong>
                  {t.entity_type}: {t.previous_state ?? "created"} → {t.new_state}
                </strong>
                <p>
                  {t.reason} · correlation {t.correlation_id}
                </p>
              </div>
              <span className="pill">{new Date(t.created_at).toLocaleString()}</span>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
