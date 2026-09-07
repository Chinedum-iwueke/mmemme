"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { browserClient } from "../../lib/supabase/browser";

export function VendorAccess({
  initialEmail,
  authenticated,
}: {
  initialEmail: string;
  authenticated: boolean;
}) {
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState<"venue" | "caterer">("venue");
  const [code, setCode] = useState("");
  const [phoneSent, setPhoneSent] = useState(false);
  const [consented, setConsented] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const normalizedPhone = `+234${phone.replace(/\D/g, "").replace(/^234/, "").replace(/^0/, "")}`;

  async function emailLink() {
    setBusy(true);
    setError("");
    const callback = `${location.origin}/auth/confirm?next=${encodeURIComponent("/vendor/apply")}`;
    const { error } = await browserClient().auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: callback, shouldCreateUser: true },
    });
    setBusy(false);
    if (error)
      setError(
        error.status === 429
          ? "Too many attempts. Wait before requesting another link."
          : "We could not send the secure link.",
      );
    else setMessage("Check your email and open the secure MMEMME link on this device.");
  }
  async function sendPhoneCode() {
    setBusy(true);
    setError("");
    const { error } = await browserClient().auth.updateUser({ phone: normalizedPhone });
    setBusy(false);
    if (error) setError("We could not verify that number. Check it and try again.");
    else setPhoneSent(true);
  }
  async function verifyAndCreate() {
    setBusy(true);
    setError("");
    const client = browserClient();
    const { error: verifyError } = await client.auth.verifyOtp({
      phone: normalizedPhone,
      token: code,
      type: "phone_change",
    });
    if (verifyError) {
      setBusy(false);
      setError("That code is incorrect or expired.");
      return;
    }
    const { error } = await client.rpc("create_vendor_account", {
      p_legal_name: name,
      p_category: category,
      p_phone: normalizedPhone,
      p_consent_version: "vendor-terms-2026-09",
    });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.replace("/vendor/workspace");
    router.refresh();
  }
  return (
    <section className="vendor-access-card">
      <div className="vendor-access-copy">
        <p className="eyebrow">MMEMME partner application</p>
        <h1>Show couples what makes your work trustworthy.</h1>
        <p>
          Apply once, keep every credential private, and follow each review step without chasing
          messages.
        </p>
        <ul>
          <li>For established Lagos venues and caterers</li>
          <li>Private evidence and transparent review</li>
          <li>No listing is published without MMEMME approval</li>
        </ul>
      </div>
      <div className="vendor-access-form">
        {!authenticated ? (
          <>
            <h2>Create or recover vendor access</h2>
            <p>
              We use a verified email link. The same address safely recovers an existing session
              without revealing whether an account exists.
            </p>
            <label>
              Business email
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
            <button
              className="button primary"
              disabled={busy || !email.includes("@")}
              onClick={emailLink}
            >
              {busy ? "Sending…" : "Email my secure link"}
            </button>
          </>
        ) : (
          <>
            <h2>Set up your vendor account</h2>
            <label>
              Legal business name
              <input value={name} onChange={(event) => setName(event.target.value)} minLength={2} />
            </label>
            <label>
              Business category
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value as typeof category)}
              >
                <option value="venue">Wedding venue</option>
                <option value="caterer">Wedding caterer</option>
              </select>
            </label>
            <label>
              Nigerian mobile number
              <div className="vendor-phone">
                <span>+234</span>
                <input
                  inputMode="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                />
              </div>
            </label>
            {!phoneSent ? (
              <button
                className="button primary"
                disabled={busy || name.trim().length < 2 || normalizedPhone.length !== 14}
                onClick={sendPhoneCode}
              >
                Verify business phone
              </button>
            ) : (
              <>
                <label>
                  Six-digit SMS code
                  <input
                    inputMode="numeric"
                    maxLength={6}
                    value={code}
                    onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
                  />
                </label>
                <label className="vendor-check">
                  <input
                    type="checkbox"
                    checked={consented}
                    onChange={(event) => setConsented(event.target.checked)}
                  />{" "}
                  I agree to the vendor terms, credential processing and inspection policy.
                </label>
                <button
                  className="button primary"
                  disabled={busy || code.length !== 6 || !consented}
                  onClick={verifyAndCreate}
                >
                  {busy ? "Creating workspace…" : "Verify and begin"}
                </button>
              </>
            )}
          </>
        )}
        {message && (
          <p className="vendor-success" role="status">
            {message}
          </p>
        )}
        {error && (
          <p className="form-alert" role="alert">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}
