"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { browserClient } from "../../lib/supabase/browser";

type Application = {
  id: string;
  account_id: string;
  status: string;
  requirements_version: string;
  current_step: number;
  revision: number;
  draft_data: Record<string, unknown>;
  submission_snapshot: unknown;
  submitted_at: string | null;
  decision_reason: string | null;
  expires_at: string | null;
};
type Requirement = {
  code: string;
  label: string;
  description: string;
  evidence_kind: string;
  required: boolean;
  accepted_mime_types: string[];
  max_bytes: number;
  max_pages: number | null;
};
type Evidence = {
  id: string;
  requirement_code: string;
  original_name: string;
  status: string;
  rejection_reason: string | null;
  expires_at: string | null;
};
type PackageDraft = {
  id: string;
  name: string;
  description: string;
  price_from_kobo: number;
  guest_min: number;
  guest_max: number;
  inclusions: string[];
  exclusions: string[];
  active: boolean;
};
type Event = { id: string; new_state: string; reason: string; created_at: string };
type ChangeRequest = {
  id: string;
  fields: string[];
  request_message: string;
  vendor_response: string | null;
  responded_at: string | null;
};
type Inspection = {
  id: string;
  scheduled_for: string;
  address: string;
  acknowledged_at: string | null;
  outcome: string | null;
};
type ProviderCheck = { id: string; kind: string; status: string; reviewer_decision: string | null };

const steps = ["Business", "Listing", "Packages", "Credentials", "Identity", "Review"];
const money = (kobo: number) => Math.round(kobo / 100).toLocaleString("en-NG");
export function VendorWorkspace({
  userId,
  accountId,
  role,
}: {
  userId: string;
  accountId: string;
  role: string;
}) {
  const router = useRouter();
  const client = useMemo(() => browserClient(), []);
  const [application, setApplication] = useState<Application | null>(null);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [packages, setPackages] = useState<PackageDraft[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [changes, setChanges] = useState<ChangeRequest[]>([]);
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [providerChecks, setProviderChecks] = useState<ProviderCheck[]>([]);
  const [account, setAccount] = useState<{
    legal_name: string;
    category: string;
    phone: string;
  } | null>(null);
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [listing, setListing] = useState({
    trading_name: "",
    area: "",
    description: "",
    capacity_min: "",
    capacity_max: "",
    price_naira: "",
  });
  const [pkg, setPkg] = useState({
    name: "",
    description: "",
    price: "",
    guestMin: "",
    guestMax: "",
    inclusions: "",
    exclusions: "",
  });
  const [portfolioPaths, setPortfolioPaths] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [attested, setAttested] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const saving = useRef(false);
  const hydrated = useRef(false);
  const lastSavedDraft = useRef("");
  const load = useCallback(async () => {
    const [{ data: a }, { data: app }] = await Promise.all([
      client
        .from("vendor_accounts")
        .select("legal_name,category,phone")
        .eq("id", accountId)
        .single(),
      client.from("vendor_applications").select("*").eq("account_id", accountId).single(),
    ]);
    if (!app) return;
    const application = app as Application;
    setAccount(a);
    setApplication(application);
    setStep(Math.min(application.current_step, 6));
    const accountDraft = Object.fromEntries(
      Object.entries(application.draft_data ?? {}).map(([key, value]) => [
        key,
        String(value ?? ""),
      ]),
    );
    const localValue = localStorage.getItem(`mmemme.vendor.application.${application.id}`);
    const restored = localValue ? { ...accountDraft, ...JSON.parse(localValue) } : accountDraft;
    setDraft(restored);
    lastSavedDraft.current = JSON.stringify(accountDraft);
    hydrated.current = true;
    const [
      { data: req },
      { data: ev },
      { data: p },
      { data: timeline },
      { data: changeRows },
      { data: ins },
      { data: l },
      { data: providerRows },
    ] = await Promise.all([
      client
        .from("vendor_credential_requirements")
        .select(
          "code,label,description,evidence_kind,required,accepted_mime_types,max_bytes,max_pages",
        )
        .eq("category", a!.category)
        .eq("version", application.requirements_version)
        .eq("active", true),
      client
        .from("vendor_evidence")
        .select("id,requirement_code,original_name,status,rejection_reason,expires_at")
        .eq("application_id", application.id),
      client
        .from("vendor_package_drafts")
        .select("*")
        .eq("application_id", application.id)
        .order("created_at"),
      client
        .from("vendor_application_events")
        .select("id,new_state,reason,created_at")
        .eq("application_id", application.id)
        .order("created_at", { ascending: false }),
      client
        .from("vendor_change_requests")
        .select("id,fields,request_message,vendor_response,responded_at")
        .eq("application_id", application.id)
        .order("created_at", { ascending: false }),
      client
        .from("vendor_inspections")
        .select("id,scheduled_for,address,acknowledged_at,outcome")
        .eq("application_id", application.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      client
        .from("vendor_listing_drafts")
        .select("*")
        .eq("application_id", application.id)
        .maybeSingle(),
      client
        .from("vendor_provider_checks")
        .select("id,kind,status,reviewer_decision")
        .eq("application_id", application.id),
    ]);
    setRequirements(req ?? []);
    setEvidence(ev ?? []);
    setPackages((p ?? []) as PackageDraft[]);
    setEvents(timeline ?? []);
    setChanges((changeRows ?? []) as ChangeRequest[]);
    setInspection(ins);
    setProviderChecks((providerRows ?? []) as ProviderCheck[]);
    if (l) {
      setListing({
        trading_name: l.trading_name,
        area: l.area,
        description: l.description,
        capacity_min: String(l.capacity_min ?? ""),
        capacity_max: String(l.capacity_max ?? ""),
        price_naira: l.price_from_kobo ? String(Math.round(l.price_from_kobo / 100)) : "",
      });
      setPortfolioPaths(l.portfolio_paths ?? []);
    }
  }, [accountId, client]);
  useEffect(() => {
    load().catch(() => setError("We could not load your vendor workspace."));
  }, [load]);
  useEffect(() => {
    if (
      !application ||
      !hydrated.current ||
      !["draft", "changes_requested"].includes(application.status)
    )
      return;
    const serialized = JSON.stringify(draft);
    localStorage.setItem(`mmemme.vendor.application.${application.id}`, serialized);
    if (serialized === lastSavedDraft.current || saving.current) return;
    const timer = setTimeout(async () => {
      saving.current = true;
      const { data, error } = await client.rpc("save_vendor_application", {
        p_application_id: application.id,
        p_step: step,
        p_data: draft,
        p_expected_revision: application.revision,
      });
      saving.current = false;
      if (error)
        setError("Your changes remain on this device. Reconnect or refresh before submitting.");
      else {
        lastSavedDraft.current = serialized;
        setApplication(data as Application);
      }
    }, 900);
    return () => clearTimeout(timer);
  }, [application, client, draft, step]);
  const run = async (fn: () => Promise<void>, success: string) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await fn();
      setNotice(success);
      await load();
    } catch (value) {
      setError(value instanceof Error ? value.message : "That action could not be completed.");
    } finally {
      setBusy(false);
    }
  };
  const saveStep = async (next = step) => {
    if (!application || saving.current) return;
    if (application.status === "approved") {
      setStep(Math.min(next, 6));
      return;
    }
    saving.current = true;
    const { data, error } = await client.rpc("save_vendor_application", {
      p_application_id: application.id,
      p_step: step,
      p_data: draft,
      p_expected_revision: application.revision,
    });
    saving.current = false;
    if (error) throw error;
    setApplication(data as Application);
    setStep(Math.min(next, 6));
  };
  const saveListing = async () => {
    if (!application) return;
    const capacityMin = Number(listing.capacity_min),
      capacityMax = Number(listing.capacity_max);
    if (capacityMin < 1 || capacityMax < capacityMin || listing.description.trim().length < 20)
      throw new Error("Complete the listing and use a valid capacity range.");
    const { error } = await client.from("vendor_listing_drafts").upsert({
      application_id: application.id,
      trading_name: listing.trading_name.trim(),
      area: listing.area.trim(),
      description: listing.description.trim(),
      capacity_min: capacityMin,
      capacity_max: capacityMax,
      price_from_kobo: Number(listing.price_naira) * 100,
      portfolio_paths: portfolioPaths,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    });
    if (error) throw error;
  };
  const addPackage = async () => {
    if (!application) return;
    const { error } = await client.from("vendor_package_drafts").insert({
      application_id: application.id,
      name: pkg.name.trim(),
      description: pkg.description.trim(),
      price_from_kobo: Number(pkg.price) * 100,
      guest_min: Number(pkg.guestMin),
      guest_max: Number(pkg.guestMax),
      inclusions: pkg.inclusions
        .split("\n")
        .map((v) => v.trim())
        .filter(Boolean),
      exclusions: pkg.exclusions
        .split("\n")
        .map((v) => v.trim())
        .filter(Boolean),
      updated_by: userId,
    });
    if (error) throw error;
    setPkg({
      name: "",
      description: "",
      price: "",
      guestMin: "",
      guestMax: "",
      inclusions: "",
      exclusions: "",
    });
  };
  const upload = async (requirement: Requirement, file: File) => {
    if (!application || !account) return;
    if (file.size > requirement.max_bytes)
      throw new Error(
        `${requirement.label} must be ${Math.round(requirement.max_bytes / 1048576)} MB or smaller.`,
      );
    if (!requirement.accepted_mime_types.includes(file.type))
      throw new Error(`${requirement.label} has an unsupported file type.`);
    let body: Blob = file;
    let mime = file.type;
    if (file.type.startsWith("image/")) {
      const bitmap = await createImageBitmap(file);
      const canvas = document.createElement("canvas");
      const scale = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height));
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      body = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (value) => (value ? resolve(value) : reject(new Error("Could not sanitize image"))),
          "image/webp",
          0.88,
        ),
      );
      mime = "image/webp";
    }
    const path = `${accountId}/${application.id}/${requirement.code}/${crypto.randomUUID()}`;
    const { error: uploadError } = await client.storage
      .from("vendor-credentials")
      .upload(path, body, { contentType: mime, upsert: false });
    if (uploadError) throw uploadError;
    const { data: row, error } = await client
      .from("vendor_evidence")
      .upsert(
        {
          application_id: application.id,
          requirement_code: requirement.code,
          storage_path: path,
          original_name: file.name,
          mime_type: mime,
          byte_size: body.size,
          status: "quarantined",
          ownership_attested: true,
          uploaded_by: userId,
        },
        { onConflict: "application_id,requirement_code" },
      )
      .select("id")
      .single();
    if (error) throw error;
    const { error: scanError } = await client.functions.invoke("scan-vendor-evidence", {
      body: { evidenceId: row.id },
    });
    if (scanError) throw scanError;
  };
  const uploadPortfolio = async (file: File) => {
    if (!application || !file.type.startsWith("image/") || file.size > 10 * 1024 * 1024)
      throw new Error("Portfolio media must be an image no larger than 10 MB.");
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height));
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const body = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (value) => (value ? resolve(value) : reject(new Error("Could not process image"))),
        "image/webp",
        0.86,
      ),
    );
    const path = `${accountId}/${application.id}/portfolio/${crypto.randomUUID()}.webp`;
    const { error } = await client.storage
      .from("vendor-draft-media")
      .upload(path, body, { contentType: "image/webp" });
    if (error) throw error;
    setPortfolioPaths((paths) => [...paths, path]);
  };
  const providerCheck = async (kind: "identity" | "bank_name") => {
    if (!application) return;
    const { error } = await client.functions.invoke("vendor-provider-check", {
      body: {
        applicationId: application.id,
        kind,
        providerToken: `pass_${crypto.randomUUID()}`,
        consentVersion: "verification-2026-09",
      },
    });
    if (error) throw error;
  };
  if (!application || !account)
    return (
      <section className="vendor-loading" aria-live="polite">
        <span className="vendor-spinner" />
        Preparing your secure workspace…
      </section>
    );
  const editable = ["draft", "changes_requested", "approved"].includes(application.status);
  const cleanRequirements = requirements
    .filter((r) => r.evidence_kind !== "provider")
    .every(
      (r) =>
        !r.required || evidence.some((e) => e.requirement_code === r.code && e.status === "clean"),
    );
  const providerReady = ["identity", "bank_name"].every((kind) =>
    providerChecks.some(
      (item) =>
        item.kind === kind && (item.status === "passed" || item.reviewer_decision === "accept"),
    ),
  );
  return (
    <div className="vendor-workspace">
      <aside className="vendor-sidebar">
        <a className="wordmark" href="/">
          MMEMME
        </a>
        <p className="vendor-role">
          {account.legal_name}
          <span>
            {role} · {account.category}
          </span>
        </p>
        <nav aria-label="Vendor application steps">
          {steps.map((label, index) => (
            <button
              key={label}
              aria-current={step === index + 1 ? "step" : undefined}
              onClick={() => setStep(index + 1)}
            >
              <span>{index + 1}</span>
              {label}
            </button>
          ))}
        </nav>
        <button
          className="vendor-signout"
          onClick={async () => {
            await client.auth.signOut();
            router.replace("/vendor/apply");
          }}
        >
          Sign out
        </button>
      </aside>
      <section className="vendor-main">
        <header className="vendor-workspace-head">
          <div>
            <p className="eyebrow">Vendor verification</p>
            <h1>{steps[step - 1]}</h1>
          </div>
          <span className={`vendor-status status-${application.status}`}>
            {application.status.replaceAll("_", " ")}
          </span>
        </header>
        <div className="vendor-progress">
          <span style={{ width: `${(step / 6) * 100}%` }} />
        </div>
        {notice && (
          <p className="vendor-success" role="status">
            {notice}
          </p>
        )}
        {error && (
          <p className="form-alert" role="alert">
            {error}
          </p>
        )}
        {step === 1 && (
          <Panel
            title="Business details"
            intro="These details identify the operating business and stay private unless marked for the listing."
          >
            <Field
              label="Trading name"
              value={draft.tradingName}
              onChange={(value) => setDraft({ ...draft, tradingName: value })}
            />
            <Field
              label="Lagos operating address"
              value={draft.address}
              onChange={(value) => setDraft({ ...draft, address: value })}
            />
            <Field
              label="Primary contact name"
              value={draft.contactName}
              onChange={(value) => setDraft({ ...draft, contactName: value })}
            />
            <Field
              label="References"
              value={draft.references}
              multiline
              onChange={(value) => setDraft({ ...draft, references: value })}
            />
            {(["owner", "manager"] as string[]).includes(role) && (
              <div className="vendor-check-card">
                <h3>Invite a teammate</h3>
                <p>
                  Editors may help complete the application but cannot approve, publish or change
                  roles.
                </p>
                <Field label="Teammate email" value={inviteEmail} onChange={setInviteEmail} />
                <button
                  className="button secondary"
                  disabled={busy || !inviteEmail.includes("@")}
                  onClick={() =>
                    run(async () => {
                      const { data, error } = await client.rpc("invite_vendor_member", {
                        p_account_id: accountId,
                        p_email: inviteEmail,
                        p_role: "editor",
                      });
                      if (error) throw error;
                      setInviteLink(`${location.origin}/vendor/invite?token=${data}`);
                    }, "Invitation created. Share the secure link below.")
                  }
                >
                  Create seven-day invitation
                </button>
                {inviteLink && <output className="vendor-invite-link">{inviteLink}</output>}
              </div>
            )}
            <Actions
              disabled={!editable || busy}
              back={null}
              next={() => run(() => saveStep(2), "Business details saved.")}
            />
          </Panel>
        )}
        {step === 2 && (
          <Panel
            title="Draft public listing"
            intro="This preview remains private until an operator approves and publishes it."
          >
            <div className="vendor-form-grid">
              <Field
                label="Public trading name"
                value={listing.trading_name}
                onChange={(value) => setListing({ ...listing, trading_name: value })}
              />
              <Field
                label="Lagos area or service area"
                value={listing.area}
                onChange={(value) => setListing({ ...listing, area: value })}
              />
              <Field
                label="Minimum capacity"
                type="number"
                value={listing.capacity_min}
                onChange={(value) => setListing({ ...listing, capacity_min: value })}
              />
              <Field
                label="Maximum capacity"
                type="number"
                value={listing.capacity_max}
                onChange={(value) => setListing({ ...listing, capacity_max: value })}
              />
              <Field
                label="Starting price (₦)"
                type="number"
                value={listing.price_naira}
                onChange={(value) => setListing({ ...listing, price_naira: value })}
              />
            </div>
            <Field
              label="Public description"
              value={listing.description}
              multiline
              onChange={(value) => setListing({ ...listing, description: value })}
            />
            <div className="vendor-media">
              <div>
                <strong>Owned portfolio media</strong>
                <p>
                  {portfolioPaths.length} image{portfolioPaths.length === 1 ? "" : "s"} ready.
                  Uploading confirms you own or may publish each image.
                </p>
              </div>
              <label className="button secondary vendor-upload">
                Add image
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  disabled={!editable || busy}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file)
                      run(() => uploadPortfolio(file), "Portfolio image sanitized and saved.");
                  }}
                />
              </label>
            </div>
            <div className="vendor-preview">
              <span>Private preview</span>
              <h3>{listing.trading_name || "Your business name"}</h3>
              <p>
                {listing.area || "Lagos"} · {listing.capacity_max || "—"} guests
              </p>
              <strong>
                {listing.price_naira
                  ? `From ₦${Number(listing.price_naira).toLocaleString("en-NG")}`
                  : "Add price guidance"}
              </strong>
              <p>{listing.description || "Your accurate public description will appear here."}</p>
            </div>
            <Actions
              disabled={!editable || busy}
              back={() => setStep(1)}
              next={() =>
                run(async () => {
                  await saveListing();
                  await saveStep(3);
                }, "Private listing saved.")
              }
            />
          </Panel>
        )}
        {step === 3 && (
          <Panel
            title="Packages"
            intro="Use one line per inclusion or exclusion. Quotes take immutable snapshots, so later edits never rewrite agreed terms."
          >
            {packages.map((item) => (
              <article className="vendor-package" key={item.id}>
                <div>
                  <h3>{item.name}</h3>
                  <p>
                    {item.guest_min}–{item.guest_max} guests · ₦{money(item.price_from_kobo)}
                  </p>
                </div>
                <button
                  disabled={!editable}
                  onClick={() =>
                    run(async () => {
                      await client.from("vendor_package_drafts").delete().eq("id", item.id);
                    }, "Package removed.")
                  }
                >
                  Remove
                </button>
              </article>
            ))}
            <div className="vendor-form-grid">
              <Field
                label="Package name"
                value={pkg.name}
                onChange={(value) => setPkg({ ...pkg, name: value })}
              />
              <Field
                label="Starting price (₦)"
                type="number"
                value={pkg.price}
                onChange={(value) => setPkg({ ...pkg, price: value })}
              />
              <Field
                label="Minimum guests"
                type="number"
                value={pkg.guestMin}
                onChange={(value) => setPkg({ ...pkg, guestMin: value })}
              />
              <Field
                label="Maximum guests"
                type="number"
                value={pkg.guestMax}
                onChange={(value) => setPkg({ ...pkg, guestMax: value })}
              />
            </div>
            <Field
              label="Package description"
              value={pkg.description}
              multiline
              onChange={(value) => setPkg({ ...pkg, description: value })}
            />
            <Field
              label="Inclusions, one per line"
              value={pkg.inclusions}
              multiline
              onChange={(value) => setPkg({ ...pkg, inclusions: value })}
            />
            <Field
              label="Exclusions, one per line"
              value={pkg.exclusions}
              multiline
              onChange={(value) => setPkg({ ...pkg, exclusions: value })}
            />
            <button
              className="button secondary"
              disabled={
                !editable ||
                busy ||
                pkg.name.length < 2 ||
                Number(pkg.guestMax) < Number(pkg.guestMin)
              }
              onClick={() => run(addPackage, "Package added.")}
            >
              Add package
            </button>
            <Actions
              disabled={!editable || busy || packages.length === 0}
              back={() => setStep(2)}
              next={() => run(() => saveStep(4), "Packages saved.")}
            />
          </Panel>
        )}
        {step === 4 && (
          <Panel
            title="Private credentials"
            intro="Files are private, stripped of image metadata and quarantined until scanning finishes. MMEMME operators receive only audited, time-limited access."
          >
            {requirements
              .filter((r) => r.evidence_kind !== "provider")
              .map((req) => {
                const item = evidence.find((e) => e.requirement_code === req.code);
                return (
                  <article className="vendor-requirement" key={req.code}>
                    <div>
                      <h3>
                        {req.label}
                        {req.required && <span>Required</span>}
                      </h3>
                      <p>{req.description}</p>
                      {item && (
                        <small>
                          File: {item.original_name} · {item.status}
                          {item.rejection_reason ? ` — ${item.rejection_reason}` : ""}
                        </small>
                      )}
                    </div>
                    <label className="button secondary vendor-upload">
                      {item ? "Replace file" : "Choose file"}
                      <input
                        type="file"
                        accept={req.accepted_mime_types.join(",")}
                        disabled={!editable || busy}
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file)
                            run(() => upload(req, file), "Credential uploaded and scanned.");
                        }}
                      />
                    </label>
                  </article>
                );
              })}
            <Actions
              disabled={!editable || busy || !cleanRequirements}
              back={() => setStep(3)}
              next={() => run(() => saveStep(5), "Credentials saved.")}
            />
          </Panel>
        )}
        {step === 5 && (
          <Panel
            title="Identity and bank-name checks"
            intro="MMEMME stores provider request IDs and result summaries—not raw NIN or BVN values. Provider downtime never implies approval."
          >
            {requirements
              .filter((item) => item.evidence_kind === "provider")
              .map((requirement) => (
                <div className="vendor-check-card" key={requirement.code}>
                  <h3>{requirement.label}</h3>
                  <strong className="vendor-provider-state">
                    {providerChecks.find((item) => item.kind === requirement.code)?.status ??
                      "Not started"}
                  </strong>
                  <p>
                    {requirement.description} MMEMME stores only the provider summary and request
                    ID.
                  </p>
                  <button
                    className="button secondary"
                    disabled={!editable || busy}
                    onClick={() =>
                      run(
                        () => providerCheck(requirement.code as "identity" | "bank_name"),
                        `${requirement.label} result received.`,
                      )
                    }
                  >
                    Start secure provider check
                  </button>
                </div>
              ))}
            <Actions
              disabled={!editable || busy}
              back={() => setStep(4)}
              next={() => run(() => saveStep(6), "Verification step saved.")}
            />
          </Panel>
        )}
        {step === 6 && (
          <Panel
            title={
              application.status === "approved"
                ? "Approved profile maintenance"
                : editable
                  ? "Review and submit"
                  : "Application status"
            }
            intro={
              application.status === "approved"
                ? "Propose updates without changing the approved live listing until MMEMME reviews them."
                : editable
                  ? "Review every section, then attest that the information and usage rights are accurate."
                  : "Your application is locked while MMEMME reviews its submitted snapshot."
            }
          >
            {changes.map((change) => (
              <article className="vendor-change" key={change.id}>
                <strong>Changes requested</strong>
                <p>{change.request_message}</p>
                <p>Fields: {change.fields.join(", ")}</p>
                {!change.responded_at && (
                  <ChangeResponse
                    onSend={(response) =>
                      run(async () => {
                        const { error } = await client.rpc("respond_vendor_change_request", {
                          p_request_id: change.id,
                          p_response: response,
                        });
                        if (error) throw error;
                      }, "Response sent.")
                    }
                  />
                )}
              </article>
            ))}
            {inspection && (
              <article className="vendor-inspection">
                <strong>Site inspection</strong>
                <p>
                  {new Date(inspection.scheduled_for).toLocaleString("en-NG")} ·{" "}
                  {inspection.address}
                </p>
                {!inspection.acknowledged_at && (
                  <button
                    className="button secondary"
                    onClick={() =>
                      run(async () => {
                        const { error } = await client
                          .from("vendor_inspections")
                          .update({ acknowledged_at: new Date().toISOString() })
                          .eq("id", inspection.id);
                        if (error) throw error;
                      }, "Inspection acknowledged.")
                    }
                  >
                    Acknowledge appointment
                  </button>
                )}
              </article>
            )}
            <dl className="vendor-summary">
              <div>
                <dt>Business</dt>
                <dd>{account.legal_name}</dd>
              </div>
              <div>
                <dt>Listing</dt>
                <dd>{listing.trading_name || "Incomplete"}</dd>
              </div>
              <div>
                <dt>Packages</dt>
                <dd>{packages.length}</dd>
              </div>
              <div>
                <dt>Clean credentials</dt>
                <dd>{evidence.filter((e) => e.status === "clean").length}</dd>
              </div>
            </dl>
            {editable && application.status !== "approved" && (
              <>
                <label className="vendor-check">
                  <input
                    type="checkbox"
                    checked={attested}
                    onChange={(event) => setAttested(event.target.checked)}
                  />{" "}
                  I attest that the information is accurate and MMEMME may review the submitted
                  evidence and owned media.
                </label>
                <button
                  className="button primary"
                  disabled={
                    busy ||
                    !attested ||
                    !cleanRequirements ||
                    !providerReady ||
                    packages.length === 0
                  }
                  onClick={() =>
                    run(async () => {
                      const { error } = await client.rpc("submit_vendor_application", {
                        p_application_id: application.id,
                        p_attested: true,
                        p_idempotency_key: crypto.randomUUID(),
                      });
                      if (error) throw error;
                    }, "Application submitted.")
                  }
                >
                  Submit verification package
                </button>
              </>
            )}
            {application.status === "approved" && (
              <button
                className="button secondary"
                onClick={() =>
                  run(async () => {
                    const { error } = await client.rpc("propose_vendor_maintenance", {
                      p_application_id: application.id,
                      p_fields: ["listing", "packages"],
                      p_reason: "Vendor submitted profile and package maintenance for review",
                    });
                    if (error) throw error;
                  }, "Changes sent for review; the live listing is unchanged.")
                }
              >
                Propose listing updates
              </button>
            )}
            <div className="vendor-timeline">
              <h2>Status history</h2>
              {events.map((item) => (
                <article key={item.id}>
                  <span />
                  <div>
                    <strong>{item.new_state.replaceAll("_", " ")}</strong>
                    <p>{item.reason}</p>
                    <small>{new Date(item.created_at).toLocaleString("en-NG")}</small>
                  </div>
                </article>
              ))}
            </div>
          </Panel>
        )}
      </section>
    </div>
  );
}
function Panel({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <section className="vendor-panel">
      <h2>{title}</h2>
      <p className="vendor-intro">{intro}</p>
      {children}
    </section>
  );
}
function Field({
  label,
  value,
  onChange,
  multiline = false,
  type = "text",
}: {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  type?: string;
}) {
  return (
    <label>
      {label}
      {multiline ? (
        <textarea rows={4} value={value ?? ""} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input type={type} value={value ?? ""} onChange={(event) => onChange(event.target.value)} />
      )}
    </label>
  );
}
function Actions({
  back,
  next,
  disabled,
}: {
  back: (() => void) | null;
  next: () => void;
  disabled: boolean;
}) {
  return (
    <div className="vendor-actions">
      {back && (
        <button className="button secondary" onClick={back}>
          Back
        </button>
      )}
      <button className="button primary" disabled={disabled} onClick={next}>
        Save and continue
      </button>
    </div>
  );
}
function ChangeResponse({ onSend }: { onSend: (value: string) => void }) {
  const [value, setValue] = useState("");
  return (
    <div>
      <label>
        Your response
        <textarea rows={3} value={value} onChange={(event) => setValue(event.target.value)} />
      </label>
      <button
        className="button secondary"
        disabled={value.trim().length < 10}
        onClick={() => onSend(value)}
      >
        Send response
      </button>
    </div>
  );
}
