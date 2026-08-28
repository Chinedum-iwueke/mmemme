import type { Metadata } from "next";
import Link from "next/link";
import { PaymentRecovery } from "../../../components/customer/payment-recovery";
import { requireCustomer } from "../../../lib/supabase/server";
export const metadata: Metadata = {
  title: "Checking your payment",
  robots: { index: false, follow: false },
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ booking?: string }>;
}) {
  const id = (await searchParams).booking ?? "";
  await requireCustomer(`/checkout/return?booking=${id}`);
  return (
    <main className="customer-page" id="main">
      <div className="shell narrow">
        <p className="eyebrow">Secure checkout return</p>
        <h1>We’re checking with Paystack.</h1>
        <p>
          Coming back from checkout never marks a payment successful. MMEMME waits for a signed
          provider event and verifies the amount on the server.
        </p>
        <PaymentRecovery bookingId={id} />
        <Link className="button secondary" href={`/bookings/${id}`}>
          Return to booking
        </Link>
      </div>
    </main>
  );
}
