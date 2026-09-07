import { assignCase } from "./actions";

export function AssignmentForm({
  entityType,
  entityId,
  correlationId,
  admins,
  current,
}: {
  entityType:
    | "booking"
    | "vendor_application"
    | "support"
    | "cancellation"
    | "refund"
    | "dispute"
    | "payout"
    | "reconciliation";
  entityId: string;
  correlationId: string;
  admins: { user_id: string; profiles: { full_name: string } | null }[];
  current?: { assigned_to: string; priority: string; due_at: string | null };
}) {
  return (
    <details className="assignment">
      <summary>{current ? `Owned · ${current.priority}` : "Assign owner and SLA"}</summary>
      <form action={assignCase} className="form compact-form">
        <input type="hidden" name="entityType" value={entityType} />
        <input type="hidden" name="entityId" value={entityId} />
        <input type="hidden" name="correlationId" value={correlationId} />
        <label>
          Owner
          <select name="assignedTo" defaultValue={current?.assigned_to} required>
            <option value="">Choose operator</option>
            {admins.map((admin) => (
              <option value={admin.user_id} key={admin.user_id}>
                {admin.profiles?.full_name ?? admin.user_id.slice(0, 8)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Priority
          <select name="priority" defaultValue={current?.priority ?? "normal"}>
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </label>
        <label>
          Due at
          <input name="dueAt" type="datetime-local" required />
        </label>
        <label>
          Reason
          <input name="reason" minLength={5} required placeholder="Why this owner and deadline?" />
        </label>
        <button className="secondary">Save assignment</button>
      </form>
    </details>
  );
}
