import type { Metadata } from "next";
import { ContentPage } from "../../components/public/content-page";
export const metadata: Metadata = {
  title: "How booking works",
  alternates: { canonical: "/how-it-works" },
};
export default function Page() {
  return (
    <ContentPage
      eyebrow="From search to celebration"
      title="A supported booking, without scattered conversations."
      intro="MMEMME keeps discovery, terms, payment confirmation and support in one clear journey."
      action={{ href: "/search", label: "Search curated vendors" }}
    >
      <h2>1. Search without signing in</h2>
      <p>
        Explore published venues and caterers by Lagos area and guest capacity. Search results are
        curated; they do not claim live availability.
      </p>
      <h2>2. Send a structured request</h2>
      <p>
        Choose one vendor and package for one wedding date. Venues and caterers remain separate
        bookings so their terms stay clear.
      </p>
      <h2>3. We confirm the facts</h2>
      <p>
        MMEMME operations contacts the vendor to confirm the date, final price, inclusions, deposit
        schedule and cancellation consequences.
      </p>
      <h2>4. Review an expiring quote</h2>
      <p>
        You see the complete terms before accepting. A changed or expired quote cannot be paid as
        though it were current.
      </p>
      <h2>5. Pay through hosted checkout</h2>
      <p>
        MMEMME confirms payment only after Paystack’s signed server notification and transaction
        verification. We do not handle raw card details or describe ordinary settlement as escrow.
      </p>
      <h2>6. Keep support in one place</h2>
      <p>
        Your booking workspace records receipts, milestones, support, cancellation requests,
        disputes and the eventual verified review.
      </p>
    </ContentPage>
  );
}
