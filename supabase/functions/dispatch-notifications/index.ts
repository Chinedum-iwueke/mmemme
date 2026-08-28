import { adminClient } from "../_shared/supabase.ts";
Deno.serve(async (request) => {
  if (request.headers.get("x-cron-secret") !== Deno.env.get("CRON_SECRET"))
    return new Response("Unauthorized", { status: 401 });
  const admin = adminClient();
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
  return Response.json({ processed: rows?.length ?? 0 });
});
