import { ContentPage, LegalNotice } from "../../components/public/content-page";
import { legalMetadata, legalVersion } from "../../lib/legal";
export const metadata = legalMetadata("Dispute process", "/disputes");
export default function Page() {
  return (
    <ContentPage
      eyebrow="Legal"
      title="Dispute process"
      intro="A documented path for raising and reviewing problems with an MMEMME booking."
    >
      <LegalNotice version={legalVersion} />
      <h2>Open a dispute</h2>
      <p>
        Use the booking workspace so the request is linked to the vendor, quote, payment and support
        history. Describe the expected outcome and attach only relevant evidence.
      </p>
      <h2>Review</h2>
      <p>
        MMEMME records both parties’ information, transaction evidence and fulfilment milestones.
        The MVP does not use automated adjudication.
      </p>
      <h2>Authority and escalation</h2>
      <p>
        Response targets, decision authority, external escalation and consumer-law remedies require
        Nigerian counsel approval before launch.
      </p>
    </ContentPage>
  );
}
