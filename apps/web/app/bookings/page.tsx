import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = { title: "My bookings", robots: { index: false, follow: false } };
export default function Page() {
  return (
    <main className="state-page" id="main">
      <p className="eyebrow">Customer workspace</p>
      <h1>Your web bookings are coming next.</h1>
      <p>
        The mobile app remains the current booking surface. Secure web sign-in, requests, quotes and
        booking management are Milestone 11.
      </p>
      <div>
        <Link className="button primary" href="/search">
          Search vendors
        </Link>
        <Link className="text-link" href="/contact">
          Get help
        </Link>
      </div>
    </main>
  );
}
