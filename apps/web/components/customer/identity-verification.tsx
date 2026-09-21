"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { browserClient } from "../../lib/supabase/browser";

type Verification = {
  status: string;
  email_verified_at: string | null;
  national_identity_verified_at: string | null;
  document_verified_at: string | null;
  selfie_liveness_verified_at: string | null;
  face_match_verified_at: string | null;
  checked_at: string | null;
  expires_at: string | null;
} | null;

export function IdentityVerification({
  initial,
  initialEmail,
  vendorApplicationId,
}: {
  initial: Verification;
  initialEmail: string;
  vendorApplicationId: string | null;
}) {
  const client = useMemo(() => browserClient(), []);
  const router = useRouter();
  const [email, setEmail] = useState(initialEmail);
  const [ninConsent, setNinConsent] = useState(false);
  const [proofingConsent, setProofingConsent] = useState(false);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    if (!initial?.email_verified_at)
      client.functions
        .invoke("sync-account-email-verification", { body: {} })
        .then(({ data }) => data?.data?.emailVerified && router.refresh());
  }, [client, initial?.email_verified_at, router]);

  const invoke = async (name: string, body: Record<string, unknown>) => {
    setBusy(name);
    setMessage("");
    const { data, error } = await client.functions.invoke(name, { body });
    setBusy("");
    if (error) throw error;
    return data?.data;
  };
  const state = (done: boolean) => (
    <span className={`customer-status ${done ? "success" : "warning"}`}>
      {done ? "Completed" : "Not completed"}
    </span>
  );
  return (
    <div className="identity-grid">
      {message && <p className="success-banner">{message}</p>}
      <section className="identity-card">
        <div className="identity-card-head">
          <div>
            <p className="eyebrow">Step 1</p>
            <h2>Verify your email</h2>
          </div>
          {state(Boolean(initial?.email_verified_at))}
        </div>
        <p>We send a confirmation link. Your email address is never displayed publicly.</p>
        <label>
          Email address
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <button
          className="button secondary"
          disabled={busy !== "" || !email.includes("@")}
          onClick={async () => {
            setBusy("email");
            const { error } = await client.auth.updateUser(
              { email },
              { emailRedirectTo: `${location.origin}/auth/confirm?next=/account/verification` },
            );
            setBusy("");
            if (error) setMessage(error.message);
            else setMessage("Check your inbox and open the confirmation link.");
          }}
        >
          Send verification email
        </button>
      </section>

      <section className="identity-card">
        <div className="identity-card-head">
          <div>
            <p className="eyebrow">Step 2</p>
            <h2>Confirm with NINAuth</h2>
          </div>
          {state(Boolean(initial?.national_identity_verified_at))}
        </div>
        <p>
          NINAuth confirms your national identity. MMEMME does not ask you to enter or upload your
          NIN and does not retain your NIN profile.
        </p>
        <label className="acknowledgement">
          <input
            type="checkbox"
            checked={ninConsent}
            onChange={(event) => setNinConsent(event.target.checked)}
          />
          <span>I consent to this identity confirmation for optional marketplace trust.</span>
        </label>
        <button
          className="button secondary"
          disabled={busy !== "" || !ninConsent}
          onClick={async () => {
            try {
              const result = await invoke("start-vendor-nin-verification", {
                consentAccepted: true,
                consentVersion: "nin-verification-2026-09",
                ...(vendorApplicationId ? { applicationId: vendorApplicationId } : {}),
              });
              location.assign(result.authorizationUrl);
            } catch {
              setMessage("NINAuth is not configured for this environment yet.");
            }
          }}
        >
          Continue securely to NINAuth
        </button>
      </section>

      <section className="identity-card">
        <div className="identity-card-head">
          <div>
            <p className="eyebrow">Step 3</p>
            <h2>ID and selfie match</h2>
          </div>
          {state(
            Boolean(
              initial?.document_verified_at &&
              initial?.selfie_liveness_verified_at &&
              initial?.face_match_verified_at,
            ),
          )}
        </div>
        <p>
          An approved provider checks document authenticity, selfie liveness and whether the faces
          match. Capture happens on the provider’s secure page; MMEMME keeps only the outcome.
        </p>
        <label className="acknowledgement">
          <input
            type="checkbox"
            checked={proofingConsent}
            onChange={(event) => setProofingConsent(event.target.checked)}
          />
          <span>
            I explicitly consent to biometric processing for this check and understand I may ask for
            manual review.
          </span>
        </label>
        <button
          className="button secondary"
          disabled={busy !== "" || !proofingConsent}
          onClick={async () => {
            try {
              const result = await invoke("start-account-proofing", {
                consentAccepted: true,
                consentVersion: "identity-proofing-2026-09",
              });
              location.assign(result.hostedUrl);
            } catch {
              setMessage("The ID and selfie provider is not configured for this environment yet.");
            }
          }}
        >
          Start secure ID and selfie check
        </button>
      </section>
    </div>
  );
}
