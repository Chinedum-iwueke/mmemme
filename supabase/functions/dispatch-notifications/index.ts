import { adminClient } from "../_shared/supabase.ts";
Deno.serve(async (request) => {
  if (request.headers.get("x-cron-secret") !== Deno.env.get("CRON_SECRET"))
    return new Response("Unauthorized", { status: 401 });
  const admin = adminClient();
  await admin.rpc("expire_vendor_applications");
  const { data: due } = await admin
    .from("booking_reminders")
    .select("id,booking_id,customer_id,kind")
    .lte("remind_at", new Date().toISOString())
    .is("delivered_at", null)
    .limit(100);
  for (const reminder of due ?? []) {
    await admin.from("customer_notifications").insert({
      customer_id: reminder.customer_id,
      booking_id: reminder.booking_id,
      kind: reminder.kind,
      title: "Your MMEMME event is approaching",
      body: "Open your booking for the latest confirmed details.",
      deep_link: `mmemme://booking/${reminder.booking_id}`,
    });
    await admin
      .from("booking_reminders")
      .update({ delivered_at: new Date().toISOString() })
      .eq("id", reminder.id);
  }
  const { data: rows } = await admin
    .from("customer_notifications")
    .select("id,customer_id,booking_id,title,body,deep_link,push_status,email_status")
    .or("push_status.eq.pending,email_status.eq.pending")
    .limit(100);
  for (const row of rows ?? []) {
    const [{ data: prefs }, { data: tokens }, { data: profile }] = await Promise.all([
      admin
        .from("notification_preferences")
        .select("*")
        .eq("customer_id", row.customer_id)
        .maybeSingle(),
      admin
        .from("push_tokens")
        .select("token")
        .eq("customer_id", row.customer_id)
        .eq("active", true),
      admin.from("profiles").select("email").eq("id", row.customer_id).single(),
    ]);
    let pushStatus = "disabled",
      emailStatus = "disabled";
    if (prefs?.push_enabled && tokens?.length) {
      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(Deno.env.get("EXPO_ACCESS_TOKEN")
            ? { Authorization: `Bearer ${Deno.env.get("EXPO_ACCESS_TOKEN")}` }
            : {}),
        },
        body: JSON.stringify(
          tokens.map((t) => ({
            to: t.token,
            title: row.title,
            body: row.body,
            data: { bookingId: row.booking_id, url: row.deep_link },
            sound: "default",
          })),
        ),
      });
      pushStatus = response.ok ? "sent" : "failed";
    }
    if (prefs?.email_enabled && profile?.email && Deno.env.get("RESEND_API_KEY")) {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `notification-${row.id}`,
        },
        body: JSON.stringify({
          from: Deno.env.get("NOTIFICATION_FROM_EMAIL"),
          to: [profile.email],
          subject: row.title,
          text: `${row.body}\n\nOpen MMEMME: ${row.deep_link ?? ""}`,
        }),
      });
      emailStatus = response.ok ? "sent" : "failed";
    }
    await admin
      .from("customer_notifications")
      .update({ push_status: pushStatus, email_status: emailStatus })
      .eq("id", row.id);
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
      .single();
    if (owner)
      await admin.from("vendor_notifications").upsert(
        {
          application_id: application.id,
          recipient_id: owner.user_id,
          kind: "expiry",
          title: "Your MMEMME verification needs renewal",
          body: `Verification expires ${application.expires_at}. Open your workspace to renew credentials.`,
          deduplication_key: `expiry-30:${application.id}:${application.expires_at}`,
        },
        { onConflict: "deduplication_key" },
      );
  }
  const { data: vendorRows } = await admin
    .from("vendor_notifications")
    .select("id,recipient_id,title,body,deduplication_key")
    .in("email_status", ["pending", "failed"])
    .limit(100);
  for (const row of vendorRows ?? []) {
    const { data: profile } = await admin
      .from("profiles")
      .select("email")
      .eq("id", row.recipient_id)
      .single();
    let emailStatus = "suppressed";
    if (profile?.email && Deno.env.get("RESEND_API_KEY")) {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `vendor-${row.deduplication_key}`,
        },
        body: JSON.stringify({
          from: Deno.env.get("NOTIFICATION_FROM_EMAIL"),
          to: [profile.email],
          subject: row.title,
          text: `${row.body}\n\nOpen your vendor workspace: ${Deno.env.get("PUBLIC_WEB_URL")}/vendor/workspace`,
        }),
      });
      emailStatus = response.ok ? "sent" : "failed";
    }
    await admin
      .from("vendor_notifications")
      .update({
        email_status: emailStatus,
        sent_at: emailStatus === "sent" ? new Date().toISOString() : null,
      })
      .eq("id", row.id);
  }
  return Response.json({
    processed: rows?.length ?? 0,
    vendorProcessed: vendorRows?.length ?? 0,
  });
});
