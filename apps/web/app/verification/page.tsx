import type { Metadata } from "next";
import { ContentPage } from "../../components/public/content-page";
export const metadata: Metadata = {
  title: "Verification and safety",
  alternates: { canonical: "/verification" },
};
export default function Page() {
  return (
    <ContentPage
      eyebrow="Trust, explained"
      title="Verified means we show our work."
      intro="MMEMME records specific checks and their dates. Verification is never presented as a quality, availability or fulfilment guarantee."
    >
      <h2>What MMEMME records</h2>
      <ul>
        <li>Identity, phone, email and bank-name checks</li>
        <li>Business or operating-authority evidence</li>
        <li>Portfolio ownership and references</li>
        <li>A physical venue or catering operating-site inspection</li>
        <li>Reviewer, evidence status, check date and expiry date</li>
      </ul>
      <h2>What customers see</h2>
      <p>
        Every approved profile discloses which checks were recorded, when verification happened and
        when it expires. An expired record is visibly marked and must be renewed before a new
        request proceeds.
      </p>
      <h2>What verification does not mean</h2>
      <p>
        It does not guarantee subjective quality, future availability or fulfilment. MMEMME still
        confirms each date and set of commercial terms before issuing a quote.
      </p>
      <h2>Data minimization</h2>
      <p>
        Public pages never expose private notes, identification documents or reviewer identities.
        MMEMME does not store raw NIN or BVN data unless counsel and a qualified provider approve
        the process.
      </p>
    </ContentPage>
  );
}
