import type { Metadata } from "next";
import Link from "next/link";
import { createHash } from "node:crypto";
import { notFound } from "next/navigation";
import { getPublicVendor, money } from "../../../../lib/marketplace";
import { requireCustomer } from "../../../../lib/supabase/server";
import { submitBookingRequest } from "./actions";
export const metadata: Metadata = {
  title: "Request a booking",
  robots: { index: false, follow: false },
};
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const q = await searchParams;
  const vendor = await getPublicVendor(id);
  if (!vendor) notFound();
  const { client, user } = await requireCustomer(`/vendors/${id}/request`);
  const { data: brief } = await client
    .from("wedding_briefs")
    .select("id,wedding_date,guest_count,area")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!brief)
    return (
      <main className="customer-page" id="main">
        <div className="shell narrow market-empty">
          <p className="eyebrow">Before your request</p>
          <h1>Create your wedding brief</h1>
          <p>Your date and guest count anchor the request and help MMEMME check vendor fit.</p>
          <Link
            className="button primary"
            href={`/brief?next=${encodeURIComponent(`/vendors/${id}/request`)}`}
          >
            Create my brief
          </Link>
        </div>
      </main>
    );
  const requestHash = createHash("sha256")
    .update(`${user.id}:${id}:${brief.id}`)
    .digest("hex")
    .slice(0, 32);
  const clientRequestId = `${requestHash.slice(0, 8)}-${requestHash.slice(8, 12)}-4${requestHash.slice(13, 16)}-a${requestHash.slice(17, 20)}-${requestHash.slice(20)}`;
  return (
    <main className="customer-page" id="main">
      <div className="shell request-layout">
        <section>
          <p className="eyebrow">Booking request</p>
          <h1>Ask {vendor.name} about your date.</h1>
          <p>
            This starts a supported availability and terms check. It is not a confirmed booking and
            no payment is taken now.
          </p>
          <div className="request-summary">
            <p>
              <span>Date</span>
              <strong>{brief.wedding_date}</strong>
            </p>
            <p>
              <span>Guests</span>
              <strong>{brief.guest_count}</strong>
            </p>
            <p>
              <span>Area</span>
              <strong>{brief.area}</strong>
            </p>
          </div>
        </section>
        <form action={submitBookingRequest} className="request-form">
          <input name="vendorId" type="hidden" value={id} />
          <input name="briefId" type="hidden" value={brief.id} />
          <input name="clientRequestId" type="hidden" value={clientRequestId} />
          <label>
            Package
            <select name="packageId">
              <option value="">Let MMEMME recommend the best fit</option>
              {vendor.packages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {money(p.price_from_kobo)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Confirmed guest estimate
            <input
              defaultValue={brief.guest_count}
              max={vendor.capacity_max ?? 5000}
              min="10"
              name="guestCount"
              required
              type="number"
            />
          </label>
          <label>
            Requirements and questions
            <textarea
              minLength={20}
              name="requirements"
              placeholder="Tell us about service style, dietary needs, access times or must-haves…"
              required
              rows={7}
            />
          </label>
          <label className="acknowledgement">
            <input name="availabilityAcknowledged" required type="checkbox" />I understand this
            vendor’s availability is not yet confirmed. MMEMME will check the date, package, price
            and final terms before issuing a quote.
          </label>
          {q.error && (
            <p className="form-alert" role="alert">
              We could not submit this request. Check the details, refresh current availability
              information and try again.
            </p>
          )}
          <button className="button primary">Send booking request</button>
          <p className="form-note">
            Repeat submissions use one request identifier, so a retry cannot create duplicate
            bookings.
          </p>
        </form>
      </div>
    </main>
  );
}
