import { ContentPage, LegalNotice } from "../../components/public/content-page";
import { legalMetadata, legalVersion } from "../../lib/legal";
export const metadata = legalMetadata("Customer terms", "/terms");
export default function Page() {
  return (
    <ContentPage
      eyebrow="Legal"
      title="Customer terms"
      intro="The proposed rules for using MMEMME’s marketplace and managed booking workflow."
    >
      <LegalNotice version={legalVersion} />
      <h2>Marketplace role</h2>
      <p>
        MMEMME helps customers discover vendors, request bookings, review terms and make supported
        payments. The final quote identifies the selected service, price, deposit and cancellation
        consequences.
      </p>
      <h2>Availability and quotes</h2>
      <p>
        Listings do not promise live availability. A booking is not confirmed until the quote is
        accepted and authoritative payment confirmation is recorded.
      </p>
      <h2>Payments</h2>
      <p>
        Payments use hosted checkout. MMEMME does not hold itself out as an independent escrow
        service.
      </p>
      <h2>Acceptable use and liability</h2>
      <p>
        Eligibility, prohibited conduct, limitations, governing law and dispute provisions require
        Nigerian counsel approval before these terms become live.
      </p>
    </ContentPage>
  );
}
