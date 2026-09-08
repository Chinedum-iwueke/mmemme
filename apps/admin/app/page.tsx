import {
  BadgeCheck,
  BookOpenCheck,
  CircleDollarSign,
  LayoutDashboard,
  MessageSquareText,
  ShieldCheck,
  Store,
  Users,
} from "lucide-react";
import { createAdminClient, requireAdmin } from "../lib/supabase/server";
import { signOutOperator } from "./operations/actions";
import { AdminBrandLogo } from "../components/brand-logo";

export default async function OperationsDashboard() {
  const admin = await requireAdmin();
  const client = createAdminClient();
  const [{ data: bookings }, { data: vendors }, { data: payments }, { count: briefs }] =
    await Promise.all([
      client
        .from("bookings")
        .select("id,status,event_date,created_at,vendors(name,category,area)")
        .order("created_at", { ascending: false }),
      client.from("vendors").select("id,published,verification_status"),
      client.from("payments").select("id,status"),
      client.from("wedding_briefs").select("id", { count: "exact", head: true }),
    ]);
  const stages = [
    ["Briefs", briefs ?? 0],
    ["Requests", bookings?.length ?? 0],
    [
      "Quotes",
      bookings?.filter((item) => ["quote_ready", "accepted_awaiting_payment"].includes(item.status))
        .length ?? 0,
    ],
    ["Paid", payments?.filter((item) => item.status === "succeeded").length ?? 0],
    ["Completed", bookings?.filter((item) => item.status === "completed").length ?? 0],
  ] as const;
  const maxStage = Math.max(1, ...stages.map(([, count]) => count));
  const attention =
    bookings
      ?.filter((item) => ["requested", "operations_review", "disputed"].includes(item.status))
      .slice(0, 5) ?? [];
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <AdminBrandLogo />
        </div>
        <nav className="nav" aria-label="Operations navigation">
          <a className="active" href="/">
            <LayoutDashboard size={17} /> Dashboard
          </a>
          <a href="/bookings">
            <BookOpenCheck size={17} /> Booking requests
          </a>
          <a href="/vendors">
            <Store size={17} /> Vendors
          </a>
          <a href="/vendors">
            <ShieldCheck size={17} /> Verification
          </a>
          <a href="/money">
            <CircleDollarSign size={17} /> Money & ledger
          </a>
          <a href="/safety">
            <MessageSquareText size={17} /> Safety & support
          </a>
          <a href="/audit">
            <BookOpenCheck size={17} /> Audit search
          </a>
          <a href="/search">
            <BookOpenCheck size={17} /> Global search
          </a>
          {admin.adminRole === "owner" && (
            <a href="/access">
              <ShieldCheck size={17} /> Operator access
            </a>
          )}
          <a href="/delivery">
            <MessageSquareText size={17} /> Delivery diagnostics
          </a>
          <a href="/privacy">
            <ShieldCheck size={17} /> Privacy requests
          </a>
        </nav>
      </aside>
      <main className="main">
        <header className="top">
          <div>
            <div className="eyebrow">Lagos closed beta</div>
            <h1 className="title">Operations control room</h1>
            <p className="muted">
              Signed in as {admin.adminRole}. Every sensitive action is attributed.
            </p>
          </div>
          <div className="live">
            <span className="dot" />
            Sandbox mode · no live funds
          </div>
          <form action={signOutOperator}>
            <button className="secondary">Sign out</button>
          </form>
        </header>
        <section className="metrics" aria-label="Beta metrics">
          <div className="metric">
            <Users size={19} />
            <strong>{briefs ?? 0}</strong>
            <span>Wedding briefs</span>
          </div>
          <div className="metric">
            <BadgeCheck size={19} />
            <strong>{vendors?.filter((item) => item.published).length ?? 0}</strong>
            <span>Published vendors</span>
          </div>
          <div className="metric">
            <BookOpenCheck size={19} />
            <strong>{payments?.filter((item) => item.status === "succeeded").length ?? 0}</strong>
            <span>Paid bookings</span>
          </div>
          <div className="metric">
            <CircleDollarSign size={19} />
            <strong>
              {bookings?.filter((item) =>
                ["requested", "operations_review", "disputed"].includes(item.status),
              ).length ?? 0}
            </strong>
            <span>Cases need attention</span>
          </div>
        </section>
        <div className="grid">
          <section className="panel">
            <div className="panel-head">
              <h2>Requests needing attention</h2>
              <a className="link" href="/bookings">
                View queue
              </a>
            </div>
            {attention.map((request) => (
              <div className="request" key={request.id}>
                <div>
                  <strong>{request.vendors?.name ?? "Booking request"}</strong>
                  <p>
                    {request.vendors?.category} · {request.vendors?.area} · {request.event_date}
                  </p>
                </div>
                <span className="pill">{request.status.replaceAll("_", " ")}</span>
              </div>
            ))}
            {!attention.length && <p className="empty">No booking cases need attention.</p>}
          </section>
          <section className="panel">
            <div className="panel-head">
              <h2>Beta funnel</h2>
              <span className="eyebrow">Cohort 01</span>
            </div>
            <div className="funnel">
              {stages.map(([label, count]) => (
                <div className="funnel-row" key={label}>
                  <span>{label}</span>
                  <div className="bar">
                    <span style={{ width: `${Math.round((count / maxStage) * 100)}%` }} />
                  </div>
                  <strong>{count}</strong>
                </div>
              ))}
            </div>
            <div className="gate">
              <strong>Live payment gate is closed</strong>Paystack, legal, cancellation policy and
              reconciliation rehearsal must all pass.
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
