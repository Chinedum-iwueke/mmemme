import { z } from "npm:zod@3.25.76";
import { corsHeaders } from "../_shared/cors.ts";
import { failure, success } from "../_shared/api.ts";
import { adminClient, userClient } from "../_shared/supabase.ts";

const Input = z.object({ evidenceId: z.string().uuid() }).strict();
Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const auth = request.headers.get("Authorization") ?? "";
  const client = userClient(auth);
  const { data: authData } = await client.auth.getUser();
  if (!authData.user) return failure("UNAUTHORIZED", 401);
  const parsed = Input.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return failure("INVALID_REQUEST", 400);
  const { data: visible } = await client
    .from("vendor_evidence")
    .select(
      "id,application_id,requirement_code,storage_path,original_name,mime_type,byte_size,status",
    )
    .eq("id", parsed.data.evidenceId)
    .maybeSingle();
  if (!visible) return failure("NOT_FOUND", 404);
  if (visible.byte_size > 10 * 1024 * 1024) return failure("INVALID_REQUEST", 400);
  const admin = adminClient();
  await admin.from("vendor_evidence").update({ status: "scanning" }).eq("id", visible.id);
  const sandbox = Deno.env.get("MMEMME_ENV") !== "production";
  const scannerUrl = Deno.env.get("MALWARE_SCANNER_URL");
  if (!sandbox && !scannerUrl) {
    await admin.from("vendor_evidence").update({ status: "quarantined" }).eq("id", visible.id);
    return failure("PROVIDER_UNAVAILABLE", 503);
  }
  let rejected = visible.original_name.toLowerCase().includes("eicar");
  let scanReference = crypto.randomUUID();
  let pageCount = 1;
  if (!sandbox) {
    try {
      const { data: signed } = await admin.storage
        .from("vendor-credentials")
        .createSignedUrl(visible.storage_path, 300);
      if (!signed) throw new Error("signed access failed");
      const response = await fetch(scannerUrl!, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Deno.env.get("MALWARE_SCANNER_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: signed.signedUrl, mimeType: visible.mime_type }),
      });
      if (!response.ok) throw new Error("scanner unavailable");
      const result = await response.json();
      rejected = result.status !== "clean";
      scanReference = String(result.reference);
      pageCount = Number(result.pageCount ?? 1);
    } catch {
      await admin.from("vendor_evidence").update({ status: "quarantined" }).eq("id", visible.id);
      return failure("PROVIDER_UNAVAILABLE", 503);
    }
  }
  const { data: application } = await admin
    .from("vendor_applications")
    .select("account_id,requirements_version")
    .eq("id", visible.application_id)
    .single();
  const { data: account } = application
    ? await admin
        .from("vendor_accounts")
        .select("category")
        .eq("id", application.account_id)
        .single()
    : { data: null };
  const { data: requirement } = account
    ? await admin
        .from("vendor_credential_requirements")
        .select("max_pages")
        .eq("category", account.category)
        .eq("version", application!.requirements_version)
        .eq("code", visible.requirement_code)
        .single()
    : { data: null };
  if (requirement?.max_pages && pageCount > requirement.max_pages) rejected = true;
  await admin
    .from("vendor_evidence")
    .update({
      status: rejected ? "rejected" : "clean",
      scan_provider: sandbox ? "mmemme-sandbox" : "configured-scanner",
      scan_reference: scanReference,
      page_count: pageCount,
      rejection_reason: rejected ? "The file failed malware or page-limit checks" : null,
      scanned_at: new Date().toISOString(),
    })
    .eq("id", visible.id);
  return success({ evidenceId: visible.id, status: rejected ? "rejected" : "clean" });
});
