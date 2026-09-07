import Link from "next/link";
import { createAdminClient, requireAdmin } from "../../lib/supabase/server";
import { grantOperatorAccess, revokeOperatorAccess } from "./actions";

export default async function AccessPage() {
  const admin = await requireAdmin("audit");
  if (admin.adminRole !== "owner")
    return (
      <main className="ops-page">
        <h1>Access restricted</h1>
        <p>Only an operations owner can manage operator access.</p>
        <Link href="/">Return to dashboard</Link>
      </main>
    );
  const client = createAdminClient();
  const [{ data: access }, { data: profiles }] = await Promise.all([
    client
      .from("admin_access")
      .select(
        "user_id,role,active,last_seen_at,session_timeout_minutes,revoked_at,profiles!admin_access_user_id_fkey(full_name,email)",
      )
      .order("created_at"),
    client.from("profiles").select("id,full_name,email,is_admin").order("full_name"),
  ]);
  return (
    <main className="ops-page">
      <header className="ops-top">
        <div>
          <p className="eyebrow">Least privilege</p>
          <h1>Operator access</h1>
        </div>
        <Link href="/">Dashboard</Link>
      </header>
      <section className="panel">
        <h2>Grant or change access</h2>
        <form action={grantOperatorAccess} className="form two-column">
          <label>
            Existing verified profile
            <select name="userId" required>
              <option value="">Choose profile</option>
              {profiles?.map((profile) => (
                <option value={profile.id} key={profile.id}>
                  {profile.full_name} · {profile.email}
                </option>
              ))}
            </select>
          </label>
          <label>
            Role
            <select name="role">
              <option value="operations">Operations</option>
              <option value="verification">Verification</option>
              <option value="support">Support</option>
              <option value="finance">Finance</option>
              <option value="auditor">Auditor</option>
              <option value="owner">Owner</option>
            </select>
          </label>
          <label>
            Idle timeout (minutes)
            <input type="number" name="timeout" min="5" max="480" defaultValue="30" required />
          </label>
          <button className="primary">Save access</button>
        </form>
      </section>
      <section className="panel" style={{ marginTop: 18 }}>
        <h2>Current operators</h2>
        {access?.map((item) => (
          <article className="request" key={item.user_id}>
            <div>
              <strong>{item.profiles?.full_name ?? item.user_id}</strong>
              <p>
                {item.role} · {item.active ? "active" : "revoked"} · idle timeout{" "}
                {item.session_timeout_minutes}m · last seen{" "}
                {item.last_seen_at ? new Date(item.last_seen_at).toLocaleString("en-NG") : "never"}
              </p>
            </div>
            {item.active && item.user_id !== admin.id && (
              <form action={revokeOperatorAccess} className="form inline-form">
                <input type="hidden" name="userId" value={item.user_id} />
                <label>
                  Revocation reason
                  <input name="reason" required minLength={10} />
                </label>
                <button className="secondary">Revoke</button>
              </form>
            )}
          </article>
        ))}
      </section>
    </main>
  );
}
