import type { Metadata } from "next";
import { ContentPage } from "../../components/public/content-page";
export const metadata: Metadata = { title: "Contact", alternates: { canonical: "/contact" } };
export default function Page() {
  return (
    <ContentPage
      eyebrow="Talk to a person"
      title="How can MMEMME help?"
      intro="Choose the address that best matches your question. Do not send identity documents or card information by email."
    >
      <h2>Customer and booking support</h2>
      <p>
        <a href="mailto:support@mmemme.com">support@mmemme.com</a>
      </p>
      <h2>Vendor onboarding</h2>
      <p>
        <a href="mailto:vendors@mmemme.com">vendors@mmemme.com</a>
      </p>
      <h2>Privacy and legal requests</h2>
      <p>
        <a href="mailto:privacy@mmemme.com">privacy@mmemme.com</a>
      </p>
      <p>
        For an active booking, use its support thread when available so the request stays attached
        to the correct transaction.
      </p>
    </ContentPage>
  );
}
