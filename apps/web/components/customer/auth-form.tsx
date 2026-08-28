"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { browserClient } from "../../lib/supabase/browser";
const safeNext = (value: string | null) =>
  value?.startsWith("/") && !value.startsWith("//") ? value : "/bookings";
export function AuthForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [retryAt, setRetryAt] = useState(0);
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const timer = setInterval(
      () => setSeconds(Math.max(0, Math.ceil((retryAt - Date.now()) / 1000))),
      1000,
    );
    return () => clearInterval(timer);
  }, [retryAt]);
  const normalized = `+234${phone.replace(/\D/g, "").replace(/^234/, "").replace(/^0/, "")}`;
  async function send() {
    setBusy(true);
    setError("");
    const { error } = await browserClient().auth.signInWithOtp({ phone: normalized });
    setBusy(false);
    if (error) {
      setError(
        error.status === 429
          ? "Too many attempts. Wait before requesting another code."
          : "We could not send the code. Check the number and try again.",
      );
      return;
    }
    setStep("code");
    setRetryAt(Date.now() + 60_000);
  }
  async function verify() {
    setBusy(true);
    setError("");
    const { data, error } = await browserClient().auth.verifyOtp({
      phone: normalized,
      token: code,
      type: "sms",
    });
    setBusy(false);
    if (error || !data.user) {
      setError("That code is incorrect or expired. Request a new one if needed.");
      return;
    }
    const { data: profile } = await browserClient()
      .from("profiles")
      .select("full_name,email")
      .eq("id", data.user.id)
      .maybeSingle();
    router.replace(
      !profile?.email || profile.full_name === "New customer"
        ? `/auth/profile?next=${encodeURIComponent(next)}`
        : next,
    );
    router.refresh();
  }
  return (
    <div className="auth-card">
      <p className="eyebrow">Secure customer access</p>
      <h1>{step === "phone" ? "Your bookings, on every screen." : "Check your phone."}</h1>
      <p>
        {step === "phone"
          ? "Enter a Nigerian mobile number. We’ll send a one-time code—no password to remember."
          : `Enter the six-digit code sent to ${normalized}.`}
      </p>
      {step === "phone" ? (
        <>
          <label>
            Mobile number
            <div className="phone-field">
              <span>+234</span>
              <input
                autoComplete="tel"
                inputMode="tel"
                onChange={(e) => setPhone(e.target.value)}
                placeholder="801 234 5678"
                value={phone}
              />
            </div>
          </label>
          <button
            className="button primary"
            disabled={busy || normalized.length !== 14}
            onClick={send}
          >
            {busy ? "Sending…" : "Send my code"}
          </button>
        </>
      ) : (
        <>
          <label>
            One-time code
            <input
              autoComplete="one-time-code"
              inputMode="numeric"
              maxLength={6}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              value={code}
            />
          </label>
          <button className="button primary" disabled={busy || code.length !== 6} onClick={verify}>
            {busy ? "Checking…" : "Verify and continue"}
          </button>
          <button className="button-link" disabled={busy || seconds > 0} onClick={send}>
            {seconds ? `Send again in ${seconds}s` : "Send a new code"}
          </button>
        </>
      )}
      {error && (
        <p className="form-alert" role="alert">
          {error}
        </p>
      )}
      <p className="auth-note">
        Your session is stored in secure, same-site cookies and refreshed without exposing access
        tokens in page URLs or logs.
      </p>
    </div>
  );
}
