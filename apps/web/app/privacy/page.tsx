import { ContentPage, LegalNotice } from "../../components/public/content-page";
import { legalMetadata, legalVersion } from "../../lib/legal";
export const metadata = legalMetadata("Privacy notice", "/privacy");
export default function Page() {
  return (
    <ContentPage
      eyebrow="Legal"
      title="Privacy notice"
      intro="How MMEMME proposes to collect, use, retain and protect personal information during the Lagos closed beta."
    >
      <LegalNotice version={legalVersion} />
      <h2>Information we use</h2>
      <p>
        Account details, wedding brief information, booking records, support messages, payment
        references, device diagnostics and consent records needed to provide and secure the service.
      </p>
      <h2>Why we use it</h2>
      <p>
        To provide marketplace services, confirm bookings, prevent fraud, deliver receipts and
        support, meet legal duties, and improve the product with privacy-reviewed analytics.
      </p>
      <h2>Sharing and retention</h2>
      <p>
        Relevant booking information may be shared with the selected vendor and qualified service
        providers. Retention periods and Nigerian data-subject rights require counsel approval
        before launch.
      </p>
      <h2>Contact</h2>
      <p>
        Privacy requests: <a href="mailto:privacy@mmemme.com">privacy@mmemme.com</a>.
      </p>
    </ContentPage>
  );
}
