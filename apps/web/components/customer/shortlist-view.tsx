"use client";
import { useEffect, useState } from "react";
import { browserClient } from "../../lib/supabase/browser";
import { authenticatedRest } from "../../lib/supabase/rest";
import type { PublicVendor } from "../../lib/marketplace";
import { VendorGrid } from "../public/marketplace";
const KEY = "mmemme:shortlist:v1";
export function ShortlistView() {
  const [vendors, setVendors] = useState<PublicVendor[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    (async () => {
      let ids = JSON.parse(localStorage.getItem(KEY) ?? "[]") as string[];
      const {
        data: { session },
      } = await browserClient().auth.getSession();
      if (session) {
        for (const id of ids)
          await authenticatedRest("shortlist_items?on_conflict=customer_id,vendor_id", {
            method: "POST",
            headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
            body: JSON.stringify({ customer_id: session.user.id, vendor_id: id }),
          });
        const remote = await authenticatedRest<Array<{ vendor_id: string }>>(
          "shortlist_items?select=vendor_id",
        );
        ids = [...new Set([...ids, ...remote.map((item) => item.vendor_id)])];
        localStorage.setItem(KEY, JSON.stringify(ids));
      }
      if (ids.length) {
        const { data } = await browserClient()
          .from("vendors")
          .select("*,service_packages(*)")
          .in("id", ids)
          .eq("published", true)
          .eq("verification_status", "approved");
        setVendors(
          (data ?? []).map(({ service_packages, ...v }) => ({
            ...v,
            packages: service_packages,
            verification: null,
            imageUrl: v.hero_image_path
              ? browserClient().storage.from("vendor-media").getPublicUrl(v.hero_image_path).data
                  .publicUrl
              : null,
          })),
        );
      }
      setLoading(false);
    })();
  }, []);
  if (loading) return <p role="status">Restoring your shortlist…</p>;
  return vendors.length ? (
    <VendorGrid vendors={vendors} />
  ) : (
    <div className="market-empty">
      <p className="eyebrow">Your shortlist</p>
      <h2>Nothing saved yet</h2>
      <p>Save a venue or caterer from search results and it will appear here.</p>
    </div>
  );
}
