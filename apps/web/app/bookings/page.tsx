import type { Metadata } from "next";
import Link from "next/link";
import { presentStatus } from "@mmemme/domain";
import { requireCustomer } from "../../lib/supabase/server";
export const metadata: Metadata = { title: "My bookings", robots: { index: false, follow: false } };
export default async function Page() {
  const { client } = await requireCustomer("/bookings");
  const { data: bookings } = await client
    .from("bookings")
    .select("id,vendor_id,event_date,guest_count,status,created_at")
    .order("created_at", { ascending: false });
  const vendorIds = [...new Set((bookings ?? []).map((b) => b.vendor_id))];
  const { data: vendors } = vendorIds.length
    ? await client.from("vendors").select("id,name,category,area").in("id", vendorIds)
    : { data: [] };
  return (
    <main className="customer-page" id="main">
      <div className="shell">
        <header className="workspace-heading">
          <p className="eyebrow">One wedding, clear next steps</p>
          <h1>My bookings</h1>
          <p>
            Requests, quotes, receipts and support stay synchronized with the MMEMME mobile app.
          </p>
        </header>
        {bookings?.length ? (
          <div className="booking-list">
            {bookings.map((booking) => {
              const vendor = vendors?.find((v) => v.id === booking.vendor_id);
              const status = presentStatus("booking", booking.status);
              return (
                <Link
                  className="booking-list-card"
                  href={`/bookings/${booking.id}`}
                  key={booking.id}
                >
                  <div>
                    <span className={`customer-status ${status.tone}`}>{status.label}</span>
                    <h2>{vendor?.name ?? "Wedding vendor"}</h2>
                    <p>
                      {vendor?.category} · {vendor?.area}
                    </p>
                  </div>
                  <div>
                    <strong>
                      {new Intl.DateTimeFormat("en-NG", { dateStyle: "medium" }).format(
                        new Date(booking.event_date),
                      )}
                    </strong>
                    <span>{booking.guest_count} guests</span>
                  </div>
                  <p>{status.description}</p>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="market-empty">
            <p className="eyebrow">Start when you’re ready</p>
            <h2>No booking requests yet</h2>
            <p>Search curated vendors, compare the facts and submit one supported request.</p>
            <Link className="button primary" href="/search">
              Find a venue or caterer
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
