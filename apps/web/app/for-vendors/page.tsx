import type { Metadata } from "next";
import { ContentPage } from "../../components/public/content-page";
export const metadata: Metadata = {
  title: "For wedding vendors",
  alternates: { canonical: "/for-vendors" },
};
export default function Page() {
  return (
    <ContentPage
      eyebrow="For Lagos venues and caterers"
      title="Better-fit enquiries. Clearer terms. Founder-supported bookings."
      intro="Vendor onboarding is managed during the MVP so every listing and package can be accurate."
      action={{ href: "/contact?subject=vendor", label: "Start a vendor enquiry" }}
    >
      <h2>Who can apply</h2>
      <p>
        Established Lagos wedding venues and caterers who can document their work, operating
        authority, references, packages and payment details.
      </p>
      <h2>The onboarding path</h2>
      <ol>
        <li>Introductory fit call and package review</li>
        <li>Identity, contact, authority, portfolio and reference checks</li>
        <li>Physical operating-site inspection</li>
        <li>Listing and package normalization</li>
        <li>Approval and publication by MMEMME operations</li>
      </ol>
      <h2>Commercial starting point</h2>
      <p>
        The closed-beta default is a 7.5% vendor commission on MMEMME-processed payments. This is a
        testable beta policy, not a permanent rate.
      </p>
      <h2>No self-publishing</h2>
      <p>
        Submitting an enquiry does not publish a profile. MMEMME controls approval and may decline
        supply that does not fit the initial Lagos wedding marketplace.
      </p>
    </ContentPage>
  );
}
