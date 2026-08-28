import { ContentPage, LegalNotice } from "../../components/public/content-page";
import { legalMetadata, legalVersion } from "../../lib/legal";
export const metadata = legalMetadata("Refunds and cancellations", "/refunds-cancellations");
export default function Page() {
  return (
    <ContentPage
      eyebrow="Legal"
      title="Refunds and cancellations"
      intro="How category templates and vendor-specific quote terms work together."
    >
      <LegalNotice version={legalVersion} />
      <h2>Your quote controls the calculation</h2>
      <p>
        Venue and catering bookings have separate deposits, fulfilment obligations and cancellation
        consequences. The exact consequences are shown before quote acceptance.
      </p>
      <h2>Requesting a cancellation</h2>
      <p>
        Customers request cancellation from the booking workspace. MMEMME records the request,
        applies the accepted terms, and communicates the proposed amount before processing an
        approved refund.
      </p>
      <h2>Timing and failed refunds</h2>
      <p>
        Gateway and bank processing times, partial-refund treatment and recovery procedures require
        counsel, accounting and Paystack approval before live payments.
      </p>
    </ContentPage>
  );
}
