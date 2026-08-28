import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = {
  title: "Customer sign in",
  robots: { index: false, follow: false },
};
export default function Page() {
  return (
    <main className="state-page" id="main">
      <p className="eyebrow">Customer account</p>
      <h1>Sign-in arrives with the booking workspace.</h1>
      <p>
        Public discovery is ready. Secure phone authentication and return-to-booking are delivered
        in Milestone 11 and are not being simulated here.
      </p>
      <div>
        <Link className="button primary" href="/search">
          Continue browsing
        </Link>
        <Link className="text-link" href="/contact">
          Contact support
        </Link>
      </div>
    </main>
  );
}
