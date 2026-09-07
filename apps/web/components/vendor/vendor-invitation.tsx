"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { browserClient } from "../../lib/supabase/browser";
export function VendorInvitation() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";
  const [email, setEmail] = useState("");
  const [user, setUser] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    browserClient()
      .auth.getUser()
      .then(({ data }) => setUser(Boolean(data.user)));
  }, []);
  const login = async () => {
    const callback = `${location.origin}/auth/confirm?next=${encodeURIComponent(`/vendor/invite?token=${token}`)}`;
    const { error } = await browserClient().auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: callback, shouldCreateUser: true },
    });
    if (error) setError("We could not send the secure email link.");
    else setMessage("Check your email to continue this invitation.");
  };
  const accept = async () => {
    const { error } = await browserClient().rpc("accept_vendor_invitation", { p_token: token });
    if (error) {
      setError(error.message);
      return;
    }
    router.replace("/vendor/workspace");
    router.refresh();
  };
  return (
    <section className="vendor-access-card">
      <div className="vendor-access-copy">
        <p className="eyebrow">MMEMME vendor team</p>
        <h1>Join a trusted vendor workspace.</h1>
        <p>
          Membership is scoped to one vendor organization and every change remains attributable.
        </p>
      </div>
      <div className="vendor-access-form">
        <h2>Accept invitation</h2>
        {user ? (
          <>
            <p>Continue only if this invitation was sent to your verified account email.</p>
            <button className="button primary" disabled={!token} onClick={accept}>
              Accept and open workspace
            </button>
          </>
        ) : (
          <>
            <label>
              Your invited email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <button
              className="button primary"
              disabled={!email.includes("@") || !token}
              onClick={login}
            >
              Verify email to continue
            </button>
          </>
        )}
        {message && <p className="vendor-success">{message}</p>}
        {error && (
          <p className="form-alert" role="alert">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}
