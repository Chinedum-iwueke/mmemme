import { createAdminClient, requireAdmin } from "../../lib/supabase/server";
import { completePrivacyRequest } from "./actions";

export default async function PrivacyOperationsPage() {
  await requireAdmin("audit");
  const { data: requests } = await createAdminClient()
    .from("privacy_requests")
    .select(
      "id,kind,status,requested_at,due_at,correlation_id,profiles!privacy_requests_user_id_fkey(full_name,email)",
    )
    .order("requested_at", { ascending: false });
  return (
    <main className="main">
      <header className="top">
        <div>
          <div className="eyebrow">Privacy operations</div>
          <h1 className="title">Data requests</h1>
          <p className="muted">
            Complete exports and pseudonymized deletions without modifying retained financial
            records.
          </p>
        </div>
      </header>
      <section className="panel">
        <div className="panel-head">
          <h2>Request queue</h2>
        </div>
        {requests?.map((request) => (
          <article className="request" key={request.id}>
            <div>
              <strong>
                {request.kind} · {request.status}
              </strong>
              <p>
                {request.profiles?.full_name} · due{" "}
                {new Intl.DateTimeFormat("en-NG").format(new Date(request.due_at))}
              </p>
              <small>Correlation {request.correlation_id}</small>
            </div>
            {["requested", "in_review"].includes(request.status) && (
              <form action={completePrivacyRequest}>
                <input type="hidden" name="requestId" value={request.id} />
                <input name="reason" required minLength={10} placeholder="Decision reason" />
                <button name="decision" value="approve">
                  Complete
                </button>
                <button className="secondary" name="decision" value="reject">
                  Reject
                </button>
              </form>
            )}
          </article>
        ))}
        {!requests?.length && <p className="empty">No privacy requests.</p>}
      </section>
    </main>
  );
}
