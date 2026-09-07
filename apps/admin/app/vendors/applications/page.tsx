import Link from "next/link";
import { createAdminClient, requireAdmin } from "../../../lib/supabase/server";
import {
  completeInspection,
  reviewApplication,
  reviewProviderCheck,
  scheduleInspection,
} from "./actions";
import "./applications.css";
export default async function VendorApplicationsPage() {
  await requireAdmin();
  const client = createAdminClient();
  const [
    { data: applications },
    { data: accounts },
    { data: evidence },
    { data: checks },
    { data: inspections },
    { data: changes },
  ] = await Promise.all([
    client.from("vendor_applications").select("*").order("updated_at", { ascending: false }),
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
            </article>
          );
        })}
      </section>
    </div>
  );
}
