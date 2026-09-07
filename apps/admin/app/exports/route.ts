import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, requireAdmin } from "../../lib/supabase/server";

const cell = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
export async function GET(request: NextRequest) {
  const admin = await requireAdmin("export");
  const scope = request.nextUrl.searchParams.get("scope") ?? "bookings";
  const client = createAdminClient();
  let headers: string[];
  let rows: Record<string, unknown>[];
  if (scope === "money") {
    const { data } = await client
      .from("payments")
      .select("id,booking_id,provider_reference,amount_kobo,currency,status,paid_at,created_at")
      .limit(1000);
    headers = [
      "id",
      "booking_id",
      "provider_reference",
      "amount_kobo",
      "currency",
      "status",
      "paid_at",
      "created_at",
    ];
    rows = data ?? [];
  } else {
    const { data } = await client
      .from("bookings")
      .select("id,correlation_id,vendor_id,event_date,guest_count,status,created_at,updated_at")
      .limit(1000);
    headers = [
      "id",
      "correlation_id",
      "vendor_id",
      "event_date",
      "guest_count",
      "status",
      "created_at",
      "updated_at",
    ];
    rows = data ?? [];
  }
  await client.from("admin_audit_events").insert({
    admin_id: admin.id,
    action: "operations.exported",
    entity_type: "export",
    entity_id: crypto.randomUUID(),
    reason: `Redacted ${scope} export`,
    correlation_id: crypto.randomUUID(),
    metadata: { scope, rowCount: rows.length },
  });
  const csv = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => cell(row[header])).join(",")),
  ].join("\n");
  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="mmemme-${scope}-redacted.csv"`,
      "cache-control": "no-store",
    },
  });
}
