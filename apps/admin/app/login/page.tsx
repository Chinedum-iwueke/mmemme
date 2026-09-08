"use client";
import { FormEvent, useEffect, useState } from "react";
import { createClient } from "../../lib/supabase/browser";
import { AdminBrandLogo } from "../../components/brand-logo";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [factor, setFactor] = useState<{ id: string; challenge: string; qr?: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has("error"))
      setError("This account is not authorized or needs MFA verification.");
  }, []);
  const signIn = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    const client = createClient();
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) {
      setBusy(false);
      setError("Invalid credentials or sign-in unavailable.");
      return;
    }
    const { data: factors } = await client.auth.mfa.listFactors();
    const verified = factors?.totp.find((item) => item.status === "verified");
    if (verified) {
      const { data, error: challengeError } = await client.auth.mfa.challenge({
        factorId: verified.id,
      });
      setBusy(false);
      if (challengeError) {
        setError("Could not start MFA verification.");
        return;
      }
      setFactor({ id: verified.id, challenge: data.id });
      return;
    }
    const { data: enrollment, error: enrollError } = await client.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "MMEMME Operations",
    });
    if (enrollError) {
      setBusy(false);
      setError("Could not enrol an authenticator.");
      return;
    }
    const { data: challenge, error: challengeError } = await client.auth.mfa.challenge({
      factorId: enrollment.id,
    });
    setBusy(false);
    if (challengeError) {
      setError("Could not start MFA enrolment.");
      return;
    }
    setFactor({ id: enrollment.id, challenge: challenge.id, qr: enrollment.totp.qr_code });
  };
  const verify = async (event: FormEvent) => {
    event.preventDefault();
    if (!factor) return;
    setBusy(true);
    const { error } = await createClient().auth.mfa.verify({
      factorId: factor.id,
      challengeId: factor.challenge,
      code,
    });
    setBusy(false);
    if (error) {
      setError("That authenticator code is invalid or expired.");
      return;
    }
    window.location.assign("/vendors");
  };
  return (
    <main className="login-shell">
      <section className="login-card">
        <div className="brand admin-brand">
          <AdminBrandLogo treatment="green" />
        </div>
        <p className="eyebrow">Internal access</p>
        <h1>{factor ? "Verify your identity" : "Operations sign in"}</h1>
        <p className="muted">
          {factor
            ? "Enter the six-digit code from your authenticator app."
            : "Only approved MMEMME operators can manage vendors and verification."}
        </p>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        {factor ? (
          <form onSubmit={verify} className="form">
            {factor.qr && (
              <div className="mfa-enrol">
                <p>
                  Scan this one-time QR code with your authenticator app, then enter its six-digit
                  code.
                </p>
                <img src={factor.qr} alt="Authenticator setup QR code" width={192} height={192} />
              </div>
            )}
            <label>
              Authenticator code
              <input
                required
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
              />
            </label>
            <button className="primary" disabled={busy || code.length !== 6}>
              {busy ? "Verifying…" : "Verify"}
            </button>
          </form>
        ) : (
          <form onSubmit={signIn} className="form">
            <label>
              Email
              <input
                required
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <label>
              Password
              <input
                required
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            <button className="primary" disabled={busy}>
              {busy ? "Signing in…" : "Continue"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
