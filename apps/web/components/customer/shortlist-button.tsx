"use client";
import { useEffect, useState } from "react";
import { browserClient } from "../../lib/supabase/browser";
import { authenticatedRest } from "../../lib/supabase/rest";
const KEY = "mmemme:shortlist:v1";
const local = () => JSON.parse(localStorage.getItem(KEY) ?? "[]") as string[];
export function ShortlistButton({ vendorId }: { vendorId: string }) {
  const [saved, setSaved] = useState(false);
  useEffect(() => setSaved(local().includes(vendorId)), [vendorId]);
  async function toggle() {
    const next = saved
      ? local().filter((id) => id !== vendorId)
      : [...new Set([...local(), vendorId])];
    localStorage.setItem(KEY, JSON.stringify(next));
    setSaved(!saved);
    const {
      data: { session },
    } = await browserClient().auth.getSession();
    if (session) {
      if (saved)
        await authenticatedRest(`shortlist_items?vendor_id=eq.${vendorId}`, { method: "DELETE" });
      else
        await authenticatedRest("shortlist_items?on_conflict=customer_id,vendor_id", {
          method: "POST",
          headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
          body: JSON.stringify({ customer_id: session.user.id, vendor_id: vendorId }),
        });
    }
  }
  return (
    <button
      aria-label={saved ? "Remove from shortlist" : "Add to shortlist"}
      aria-pressed={saved}
      className="shortlist-button"
      onClick={toggle}
      type="button"
    >
      {saved ? "Saved" : "Save"}
    </button>
  );
}
