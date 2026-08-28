import { completeProfile } from "./actions";
import { requireCustomer } from "../../../lib/supabase/server";
export const metadata = { title: "Complete your profile", robots: { index: false, follow: false } };
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const q = await searchParams;
  const { client, user } = await requireCustomer("/auth/profile");
  const { data } = await client
    .from("profiles")
    .select("full_name,email")
    .eq("id", user.id)
    .maybeSingle();
  return (
    <main className="auth-page" id="main">
      <form action={completeProfile} className="auth-card">
        <input name="next" type="hidden" value={q.next ?? "/bookings"} />
        <p className="eyebrow">One last detail</p>
        <h1>Who are we helping celebrate?</h1>
        <p>
          Your name personalizes support. Your email receives quotes, receipts and critical recovery
          messages.
        </p>
        <label>
          Full name
          <input
            autoComplete="name"
            defaultValue={data?.full_name === "New customer" ? "" : data?.full_name}
            minLength={2}
            name="name"
            required
          />
        </label>
        <label>
          Receipt email
          <input
            autoComplete="email"
            defaultValue={data?.email ?? user.email ?? ""}
            name="email"
            required
            type="email"
          />
        </label>
        {q.error && (
          <p className="form-alert" role="alert">
            We could not save those details. Check them and try again.
          </p>
        )}
        <button className="button primary">Save and continue</button>
      </form>
    </main>
  );
}
