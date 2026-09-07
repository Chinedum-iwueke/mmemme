import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient, requireAdmin } from "../../../../../../lib/supabase/server";
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ applicationId: string; evidenceId: string }> },
) {
  const admin = await requireAdmin("vendors");
  const { applicationId, evidenceId } = await params;
  const client = createAdminClient();
  const { data: evidence } = await client
    .from("vendor_evidence")
    .select("storage_path,status")
    .eq("id", evidenceId)
    .eq("application_id", applicationId)
    .single();
  if (!evidence || evidence.status !== "clean")
    return new NextResponse("Evidence is unavailable until scanning succeeds.", { status: 409 });
  const { data } = await client.storage
    .from("vendor-credentials")
    .createSignedUrl(evidence.storage_path, 300);
  if (!data) return new NextResponse("Could not create secure access.", { status: 500 });
  await client.from("admin_audit_events").insert({
    admin_id: admin.id,
    action: "vendor_evidence.viewed",
    entity_type: "vendor_application",
    entity_id: applicationId,
    reason: "Operator opened a five-minute signed evidence URL",
    metadata: { evidenceId },
    correlation_id: crypto.randomUUID(),
  });
  return NextResponse.redirect(data.signedUrl);
}
