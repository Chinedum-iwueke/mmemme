import Link from "next/link";
import { createAdminClient, requireAdmin } from "../../../lib/supabase/server";
import {
  completeInspection,
  reviewApplication,
  reviewProviderCheck,
  scheduleInspection,
} from "./actions";
import "./applications.css";
import { AssignmentForm } from "../../operations/assignment-form";
export default async function VendorApplicationsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin("vendors");
  const { status } = await searchParams;
  const client = createAdminClient();
  const [
    { data: applications },
    { data: accounts },
    { data: evidence },
    { data: checks },
    { data: inspections },
    { data: changes },
    { data: memberships },
    { data: profiles },
    { data: events },
    { data: assignments },
    { data: admins },
  ] = await Promise.all([
    status
      ? client
          .from("vendor_applications")
          .select("*")
          .eq("status", status as never)
          .order("updated_at", { ascending: false })
          .limit(50)
      : client
          .from("vendor_applications")
          .select("*")
          .order("updated_at", { ascending: false })
          .limit(50),
    client.from("vendor_accounts").select("id,legal_name,category,phone"),
    client
      .from("vendor_evidence")
      .select("id,application_id,requirement_code,original_name,status,expires_at"),
    client
      .from("vendor_provider_checks")
      .select("id,application_id,kind,status,result_summary,reviewer_decision"),
    client.from("vendor_inspections").select("*").order("created_at", { ascending: false }),
    client
      .from("vendor_change_requests")
      .select("application_id,fields,request_message,vendor_response,responded_at,resolved_at"),
    client.from("vendor_memberships").select("account_id,user_id,role"),
    client.from("profiles").select("id,is_admin,full_name"),
    client
      .from("vendor_application_events")
      .select("application_id,previous_state,new_state,reason,created_at")
      .order("created_at", { ascending: false }),
    client
      .from("operations_assignments")
      .select("entity_id,assigned_to,priority,due_at")
      .eq("entity_type", "vendor_application"),
    client
      .from("admin_access")
      .select("user_id,profiles!admin_access_user_id_fkey(full_name)")
      .eq("active", true)
      .is("revoked_at", null),
  ]);
  return (
    <div className="ops-page application-page">
      <header className="ops-top">
        <div>
          <p className="eyebrow">Supply verification</p>
          <h1>Vendor applications</h1>
        </div>
        <Link href="/vendors">Published supply</Link>
      </header>
      <form method="get" className="application-filter panel">
        <label>
          Status{" "}
          <select name="status" defaultValue={status ?? ""}>
            <option value="">All applications</option>
            <option value="submitted">Submitted</option>
            <option value="in_review">In review</option>
            <option value="inspection_pending">Inspection pending</option>
            <option value="changes_requested">Changes requested</option>
            <option value="approved">Approved</option>
            <option value="suspended">Suspended</option>
          </select>
        </label>
        <button className="secondary">Apply queue</button>
      </form>
      <section className="application-summary">
        <div>
          <strong>
            {applications?.filter((item) => ["submitted", "in_review"].includes(item.status))
              .length ?? 0}
          </strong>
          <span>awaiting review</span>
        </div>
        <div>
          <strong>
            {applications?.filter((item) => item.status === "inspection_pending").length ?? 0}
          </strong>
          <span>inspection pending</span>
        </div>
        <div>
          <strong>
            {applications?.filter((item) => item.status === "changes_requested").length ?? 0}
          </strong>
          <span>vendor changes</span>
        </div>
      </section>
      <section className="application-list">
        {applications?.map((app) => {
          const account = accounts?.find((item) => item.id === app.account_id);
          const files = evidence?.filter((item) => item.application_id === app.id) ?? [];
          const providerChecks = checks?.filter((item) => item.application_id === app.id) ?? [];
          const inspection = inspections?.find((item) => item.application_id === app.id);
          const requests = changes?.filter((item) => item.application_id === app.id) ?? [];
          const history = events?.filter((item) => item.application_id === app.id) ?? [];
          const conflict = memberships?.some(
            (member) =>
              member.account_id === app.account_id &&
              profiles?.some((profile) => profile.id === member.user_id && profile.is_admin),
          );
          return (
            <article className="application-card" key={app.id}>
              <header>
                <div>
                  <h2>{account?.legal_name}</h2>
                  <p>
                    {account?.category} · {account?.phone}
                  </p>
                </div>
                <span className={`status ${app.status}`}>{app.status.replaceAll("_", " ")}</span>
              </header>
              {conflict && (
                <p className="conflict-alert" role="alert">
                  Dual-role conflict: a member of this vendor account also has administrator status.
                  A different operator must review and approve this application.
                </p>
              )}
              <AssignmentForm
                entityType="vendor_application"
                entityId={app.id}
                correlationId={app.id}
                admins={(admins ?? []) as never}
                current={assignments?.find((item) => item.entity_id === app.id)}
              />
              <div className="application-columns">
                <section>
                  <h3>Private evidence</h3>
                  {files.map((file) => (
                    <div className="review-row" key={file.id}>
                      <div>
                        <strong>{file.requirement_code}</strong>
                        <small>
                          {file.original_name} · {file.status}
                        </small>
                      </div>
                      <Link
                        href={`/vendors/applications/${app.id}/evidence/${file.id}`}
                        target="_blank"
                      >
                        Open audited file
                      </Link>
                    </div>
                  ))}
                  {!files.length && <p className="empty">No evidence uploaded.</p>}
                  <h3>Provider summaries</h3>
                  {providerChecks.map((check) => (
                    <form action={reviewProviderCheck} className="review-row" key={check.id}>
                      <input type="hidden" name="applicationId" value={app.id} />
                      <input type="hidden" name="checkId" value={check.id} />
                      <div>
                        <strong>{check.kind}</strong>
                        <small>
                          {check.status} · {JSON.stringify(check.result_summary)}
                        </small>
                      </div>
                      <select
                        name="decision"
                        defaultValue={check.reviewer_decision ?? "manual_review"}
                      >
                        <option value="accept">Accept</option>
                        <option value="manual_review">Manual review</option>
                        <option value="reject">Reject</option>
                      </select>
                      <button>Record</button>
                    </form>
                  ))}
                </section>
                <section>
                  <h3>Inspection</h3>
                  {inspection ? (
                    <>
                      <div className="inspection">
                        <strong>
                          {new Date(inspection.scheduled_for).toLocaleString("en-NG")}
                        </strong>
                        <p>{inspection.address}</p>
                        <p>
                          {inspection.outcome ??
                            (inspection.acknowledged_at
                              ? "Acknowledged"
                              : "Awaiting acknowledgement")}
                        </p>
                      </div>
                      {!inspection.completed_at && (
                        <form action={completeInspection} className="review-form">
                          <input type="hidden" name="applicationId" value={app.id} />
                          <input type="hidden" name="inspectionId" value={inspection.id} />
                          <label>
                            Outcome
                            <select name="outcome">
                              <option value="passed">Passed</option>
                              <option value="follow_up">Follow-up</option>
                              <option value="failed">Failed</option>
                            </select>
                          </label>
                          <label>
                            Inspection notes
                            <textarea name="notes" required minLength={10} />
                          </label>
                          <button className="primary">Record inspection</button>
                        </form>
                      )}
                    </>
                  ) : (
                    <form action={scheduleInspection} className="review-form">
                      <input type="hidden" name="applicationId" value={app.id} />
                      <label>
                        Date and time
                        <input name="scheduledFor" type="datetime-local" required />
                      </label>
                      <label>
                        Inspection address
                        <input name="address" required />
                      </label>
                      <button className="secondary">Schedule inspection</button>
                    </form>
                  )}
                  <h3>Correction responses</h3>
                  {requests.map((request, index) => (
                    <div className="inspection" key={index}>
                      <strong>{request.fields.join(", ")}</strong>
                      <p>{request.request_message}</p>
                      <small>{request.vendor_response ?? "Awaiting vendor response"}</small>
                    </div>
                  ))}
                </section>
              </div>
              <details>
                <summary>Record review decision</summary>
                <form action={reviewApplication} className="decision-form">
                  <input type="hidden" name="applicationId" value={app.id} />
                  <label>
                    Next state
                    <select
                      name="status"
                      defaultValue={app.status === "submitted" ? "in_review" : "changes_requested"}
                    >
                      <option value="in_review">Begin review</option>
                      <option value="inspection_pending">Inspection pending</option>
                      <option value="changes_requested">Request changes</option>
                      <option value="approved">Approve and publish</option>
                      <option value="rejected">Reject</option>
                      <option value="suspended">Suspend</option>
                      <option value="expired">Expire</option>
                    </select>
                  </label>
                  <label>
                    Fields requiring changes
                    <input name="fields" placeholder="authority, listing, package" />
                  </label>
                  <label className="wide">
                    Reason
                    <textarea name="reason" required minLength={10} />
                  </label>
                  <button className="primary">Record authorized decision</button>
                </form>
              </details>
              <details>
                <summary>Application history ({history.length})</summary>
                {history.map((event) => (
                  <p className="application-history" key={`${event.created_at}:${event.new_state}`}>
                    {new Date(event.created_at).toLocaleString("en-NG")} ·{" "}
                    {event.previous_state ?? "created"} → {event.new_state} · {event.reason}
                  </p>
                ))}
              </details>
            </article>
          );
        })}
      </section>
    </div>
  );
}
