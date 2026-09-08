import { adminClient } from "../_shared/supabase.ts";

type Delivery = {
  id: string;
  source_type: string;
  source_id: string;
  recipient_id: string | null;
  channel: "push" | "email";
  payload: { kind?: string; title?: string; body?: string; bookingId?: string; url?: string };
  attempts: number;
};
const retryable = (status: number) => status === 429 || status >= 500;

async function reconcileExpoReceipts(admin: ReturnType<typeof adminClient>) {
  const { data: rows } = await admin
    .from("notification_outbox")
    .select("id,provider_message_id")
    .eq("channel", "push")
    .eq("status", "sent")
    .eq("provider_receipt_status", "ticketed")
    .not("provider_message_id", "is", null)
    .limit(100);
  const mappings = (rows ?? []).flatMap((row) =>
    String(row.provider_message_id)
      .split(",")
      .filter(Boolean)
      .map((mapping) => {
        const separator = mapping.indexOf(":");
        return {
          outboxId: row.id,
          ticketId: mapping.slice(0, separator),
          tokenId: mapping.slice(separator + 1),
        };
      })
      .filter((mapping) => mapping.ticketId && mapping.tokenId),
  );
  if (!mappings.length) return 0;
  const response = await fetch("https://exp.host/--/api/v2/push/getReceipts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(Deno.env.get("EXPO_ACCESS_TOKEN")
        ? { Authorization: `Bearer ${Deno.env.get("EXPO_ACCESS_TOKEN")}` }
        : {}),
    },
    body: JSON.stringify({ ids: mappings.map(({ ticketId }) => ticketId) }),
  });
  if (!response.ok) return 0;
  const result = await response.json().catch(() => ({ data: {} }));
  const receipts = result.data ?? {};
  for (const row of rows ?? []) {
    const rowMappings = mappings.filter((mapping) => mapping.outboxId === row.id);
    if (!rowMappings.every(({ ticketId }) => receipts[ticketId])) continue;
    const rowReceipts = rowMappings.map(({ ticketId }) => receipts[ticketId]);
    for (const mapping of rowMappings) {
      if (receipts[mapping.ticketId]?.details?.error === "DeviceNotRegistered")
        await admin
          .from("push_tokens")
          .update({ active: false, updated_at: new Date().toISOString() })
          .eq("id", mapping.tokenId);
    }
    const failed = rowReceipts.find((receipt) => receipt?.status === "error");
    await admin
      .from("notification_outbox")
      .update({
        provider_receipt_status: failed ? "error" : "delivered",
        last_error: failed?.message ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id)
      .eq("provider_receipt_status", "ticketed");
  }
  return mappings.length;
}

Deno.serve(async (request) => {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
  if (
    !Deno.env.get("CRON_SECRET") ||
    request.headers.get("x-cron-secret") !== Deno.env.get("CRON_SECRET")
  )
    return new Response("Unauthorized", { status: 401 });
  const admin = adminClient();
  const receiptsChecked = await reconcileExpoReceipts(admin);
  await admin.rpc("expire_vendor_applications");
  const { data: due } = await admin
    .from("booking_reminders")
    .select("id,booking_id,customer_id,kind")
    .lte("remind_at", new Date().toISOString())
    .is("delivered_at", null)
    .limit(100);
  for (const reminder of due ?? []) {
    const { error } = await admin.from("customer_notifications").upsert(
      {
        customer_id: reminder.customer_id,
        booking_id: reminder.booking_id,
        kind: reminder.kind,
        title: "Your MMEMME event is approaching",
        body: "Open your booking for the latest confirmed details.",
        deep_link: `mmemme://booking/${reminder.booking_id}`,
        web_path: `/bookings/${reminder.booking_id}`,
        deduplication_key: `reminder:${reminder.id}`,
      },
      { onConflict: "deduplication_key" },
    );
    if (!error)
      await admin
        .from("booking_reminders")
        .update({ delivered_at: new Date().toISOString() })
        .eq("id", reminder.id)
        .is("delivered_at", null);
  }
  const { data: expiring } = await admin
    .from("vendor_applications")
    .select("id,account_id,expires_at")
    .eq("status", "approved")
    .lte("expires_at", new Date(Date.now() + 30 * 86400000).toISOString());
  for (const application of expiring ?? []) {
    const { data: owner } = await admin
      .from("vendor_memberships")
      .select("user_id")
      .eq("account_id", application.account_id)
      .eq("role", "owner")
      .maybeSingle();
    if (owner)
      await admin.from("vendor_notifications").upsert(
        {
          application_id: application.id,
          recipient_id: owner.user_id,
          kind: "expiry",
          title: "Your MMEMME verification needs renewal",
          body: `Verification expires ${application.expires_at}. Renew the required credentials in your workspace.`,
          deduplication_key: `expiry-30:${application.id}:${application.expires_at}`,
        },
        { onConflict: "deduplication_key" },
      );
  }
  const leaseToken = crypto.randomUUID();
  const { data, error: claimError } = await admin.rpc("claim_notification_deliveries", {
    p_limit: 100,
    p_lease_token: leaseToken,
  });
  if (claimError) return Response.json({ error: "delivery claim failed" }, { status: 500 });
  const deliveries = (data ?? []) as Delivery[];
  for (const row of deliveries) {
    let status: "sent" | "retry" | "suppressed" | "failed" = "suppressed";
    let providerId = "",
      receiptStatus = "",
      lastError = "";
    try {
      if (!row.recipient_id) throw new Error("recipient unavailable");
      const [{ data: preferences }, { data: profile }] = await Promise.all([
        admin
          .from("notification_preferences")
          .select("push_enabled,email_enabled")
          .eq("customer_id", row.recipient_id)
          .maybeSingle(),
        admin.from("profiles").select("email").eq("id", row.recipient_id).maybeSingle(),
      ]);
      if (row.channel === "push") {
        if (preferences && !preferences.push_enabled) status = "suppressed";
        else {
          const { data: tokens } = await admin
            .from("push_tokens")
            .select("id,token")
            .eq("customer_id", row.recipient_id)
            .eq("active", true);
          if (!tokens?.length) status = "suppressed";
          else {
            const response = await fetch("https://exp.host/--/api/v2/push/send", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                ...(Deno.env.get("EXPO_ACCESS_TOKEN")
                  ? { Authorization: `Bearer ${Deno.env.get("EXPO_ACCESS_TOKEN")}` }
                  : {}),
              },
              body: JSON.stringify(
                tokens.map((token) => ({
                  to: token.token,
                  title: row.payload.title,
                  body: row.payload.body,
                  data: { bookingId: row.payload.bookingId, url: row.payload.url },
                  sound: "default",
                })),
              ),
            });
            const result = await response.json().catch(() => ({}));
            if (!response.ok) {
              status = retryable(response.status) && row.attempts < 8 ? "retry" : "failed";
              lastError = `Expo HTTP ${response.status}`;
            } else {
              const tickets = Array.isArray(result.data) ? result.data : [result.data];
              const mappings: string[] = [];
              for (let index = 0; index < tickets.length; index++) {
                const ticket = tickets[index];
                const token = tokens[index];
                if (ticket?.details?.error === "DeviceNotRegistered" && token)
                  await admin
                    .from("push_tokens")
                    .update({ active: false, updated_at: new Date().toISOString() })
                    .eq("id", token.id);
                if (ticket?.id && token) mappings.push(`${ticket.id}:${token.id}`);
              }
              providerId = mappings.join(",");
              receiptStatus = "ticketed";
              status = tickets.some((ticket) => ticket?.status === "error")
                ? row.attempts < 8
                  ? "retry"
                  : "failed"
                : "sent";
              lastError = tickets.find((ticket) => ticket?.message)?.message ?? "";
            }
          }
        }
      } else {
        const critical = ["booking_status", "support", "security"].includes(row.payload.kind ?? "");
        if (preferences && !preferences.email_enabled && !critical) status = "suppressed";
        else if (!profile?.email || !Deno.env.get("RESEND_API_KEY")) {
          status = row.attempts < 8 ? "retry" : "failed";
          lastError = "Email configuration or recipient unavailable";
        } else {
          const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
              "Content-Type": "application/json",
              "Idempotency-Key": `${row.source_type}-${row.source_id}-${row.channel}`,
            },
            body: JSON.stringify({
              from: Deno.env.get("NOTIFICATION_FROM_EMAIL"),
              to: [profile.email],
              subject: row.payload.title,
              text: `${row.payload.body}\n\nOpen MMEMME: ${Deno.env.get("PUBLIC_WEB_URL")}${row.payload.url ?? ""}`,
            }),
          });
          const result = await response.json().catch(() => ({}));
          if (response.ok) {
            status = "sent";
            providerId = String(result.id ?? "");
            receiptStatus = "accepted";
          } else {
            status = retryable(response.status) && row.attempts < 8 ? "retry" : "failed";
            lastError = `Resend HTTP ${response.status}`;
          }
        }
      }
    } catch (error) {
      status = row.attempts < 8 ? "retry" : "failed";
      lastError = error instanceof Error ? error.message : "delivery failed";
    }
    await admin.rpc("complete_notification_delivery", {
      p_id: row.id,
      p_lease_token: leaseToken,
      p_status: status,
      p_provider_id: providerId,
      p_receipt_status: receiptStatus,
      p_error: lastError,
    });
  }
  return Response.json({ claimed: deliveries.length, receiptsChecked, leaseToken });
});
