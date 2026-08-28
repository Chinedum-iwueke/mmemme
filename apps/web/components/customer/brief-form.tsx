"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { browserClient } from "../../lib/supabase/browser";
import { authenticatedRest } from "../../lib/supabase/rest";
type Brief = {
  date: string;
  area: string;
  guests: string;
  budgetMin: string;
  budgetMax: string;
  priorities: Array<"venue" | "caterer">;
};
type Remote = { brief: Brief; revision: number; source_device_id: string; updated_at: string };
const KEY = "mmemme:wedding-brief:draft:v1";
const DEVICE = "mmemme:device:v1";
const empty: Brief = {
  date: "",
  area: "",
  guests: "",
  budgetMin: "",
  budgetMax: "",
  priorities: [],
};
function deviceId() {
  let id = localStorage.getItem(DEVICE);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE, id);
  }
  return id;
}
export function BriefForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedNext = searchParams.get("next");
  const next =
    requestedNext?.startsWith("/") && !requestedNext.startsWith("//") ? requestedNext : null;
  const [brief, setBrief] = useState(empty);
  const [remote, setRemote] = useState<Remote | null>(null);
  const [conflict, setConflict] = useState(false);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    const local = JSON.parse(localStorage.getItem(KEY) ?? "null") as Brief | null;
    if (local) setBrief(local);
    browserClient()
      .auth.getSession()
      .then(async ({ data }) => {
        if (data.session) {
          const rows = await authenticatedRest<Remote[]>(
            "customer_drafts?select=brief,revision,source_device_id,updated_at",
          );
          if (rows[0]) {
            setRemote(rows[0]);
            if (local && JSON.stringify(local) !== JSON.stringify(rows[0].brief)) setConflict(true);
            else setBrief(rows[0].brief);
          }
        }
        setReady(true);
      });
  }, []);
  useEffect(() => {
    if (ready) localStorage.setItem(KEY, JSON.stringify(brief));
  }, [brief, ready]);
  const valid = useMemo(
    () =>
      brief.date > new Date().toISOString().slice(0, 10) &&
      brief.area.trim().length > 1 &&
      Number(brief.guests) >= 10 &&
      Number(brief.budgetMax) >= Number(brief.budgetMin) &&
      brief.priorities.length > 0,
    [brief],
  );
  async function sync() {
    setSaving(true);
    setMessage("");
    const {
      data: { session },
    } = await browserClient().auth.getSession();
    if (!session) {
      router.push(`/login?next=${encodeURIComponent("/brief?resume=1")}`);
      return;
    }
    try {
      const saved = await authenticatedRest<Remote>("rpc/save_customer_draft", {
        method: "POST",
        body: JSON.stringify({
          p_brief: brief,
          p_expected_revision: remote?.revision ?? 1,
          p_source_device_id: deviceId(),
        }),
      });
      setRemote(saved);
      setConflict(false);
      const { data: existing } = await browserClient()
        .from("wedding_briefs")
        .select("id")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const row = {
        customer_id: session.user.id,
        wedding_date: brief.date,
        area: brief.area.trim(),
        guest_count: Number(brief.guests),
        budget_min_kobo: Number(brief.budgetMin) * 100,
        budget_max_kobo: Number(brief.budgetMax) * 100,
        priorities: brief.priorities,
      };
      const result = existing
        ? await browserClient().from("wedding_briefs").update(row).eq("id", existing.id)
        : await browserClient().from("wedding_briefs").insert(row);
      if (result.error) throw result.error;
      setMessage("Your brief is saved on this device and your MMEMME account.");
      if (next) router.push(next);
    } catch (error) {
      if (error instanceof Error && error.message.includes("draft conflict")) setConflict(true);
      else
        setMessage(
          "Your draft is safe on this device. We could not sync it yet—check your connection and try again.",
        );
    } finally {
      setSaving(false);
    }
  }
  function choose(key: "venue" | "caterer") {
    setBrief({
      ...brief,
      priorities: brief.priorities.includes(key)
        ? brief.priorities.filter((v) => v !== key)
        : [...brief.priorities, key],
    });
  }
  if (!ready) return <p role="status">Restoring your brief…</p>;
  return (
    <div className="brief-shell">
      <div className="brief-heading">
        <p className="eyebrow">Your five-question brief</p>
        <h1>Give the search a shape.</h1>
        <p>
          We save every edit locally. Sign in once to continue the same brief on mobile or another
          browser.
        </p>
      </div>
      {conflict && (
        <div className="conflict-card" role="alert">
          <h2>This brief changed on another device</h2>
          <p>Choose which version to keep. We will never silently overwrite it.</p>
          <button
            className="button secondary"
            onClick={() => {
              if (remote) setBrief(remote.brief);
              setConflict(false);
            }}
          >
            Use account version
          </button>
          <button
            className="button primary"
            onClick={() => {
              setRemote(remote && { ...remote, brief });
              setConflict(false);
            }}
          >
            Keep this device version
          </button>
        </div>
      )}
      <form
        className="brief-grid"
        onSubmit={(e) => {
          e.preventDefault();
          sync();
        }}
      >
        <label>
          Wedding date
          <input
            min={new Date(Date.now() + 86_400_000).toISOString().slice(0, 10)}
            onChange={(e) => setBrief({ ...brief, date: e.target.value })}
            required
            type="date"
            value={brief.date}
          />
        </label>
        <label>
          Lagos area
          <input
            onChange={(e) => setBrief({ ...brief, area: e.target.value })}
            placeholder="Lekki, Ikeja, Victoria Island"
            required
            value={brief.area}
          />
        </label>
        <label>
          Estimated guests
          <input
            inputMode="numeric"
            min="10"
            onChange={(e) => setBrief({ ...brief, guests: e.target.value })}
            required
            type="number"
            value={brief.guests}
          />
        </label>
        <div className="budget-pair">
          <label>
            Minimum budget (₦)
            <input
              inputMode="numeric"
              min="0"
              onChange={(e) => setBrief({ ...brief, budgetMin: e.target.value })}
              required
              type="number"
              value={brief.budgetMin}
            />
          </label>
          <label>
            Maximum budget (₦)
            <input
              inputMode="numeric"
              min={brief.budgetMin || "0"}
              onChange={(e) => setBrief({ ...brief, budgetMax: e.target.value })}
              required
              type="number"
              value={brief.budgetMax}
            />
          </label>
        </div>
        <fieldset>
          <legend>What should we find first?</legend>
          <label className="choice">
            <input
              checked={brief.priorities.includes("venue")}
              onChange={() => choose("venue")}
              type="checkbox"
            />
            A venue that fits the day
          </label>
          <label className="choice">
            <input
              checked={brief.priorities.includes("caterer")}
              onChange={() => choose("caterer")}
              type="checkbox"
            />
            Food people remember
          </label>
        </fieldset>
        <button className="button primary" disabled={!valid || saving}>
          {saving ? "Saving…" : "Save my brief"}
        </button>
        {message && (
          <p aria-live="polite" className="save-message">
            {message}
          </p>
        )}
      </form>
    </div>
  );
}
