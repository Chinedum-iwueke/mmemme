import type { Metadata } from "next";
import { ContentPage } from "../../components/public/content-page";
export const metadata: Metadata = { title: "About", alternates: { canonical: "/about" } };
export default function Page() {
  return (
    <ContentPage
      eyebrow="Why MMEMME exists"
      title="Wedding booking should feel held together."
      intro="We are building a native marketplace for Lagos couples who want fewer unknowns between discovery and a confirmed booking."
    >
      <h2>The problem we are testing</h2>
      <p>
        Couples often discover vendors through social media, then move through fragmented messages,
        unclear packages and direct deposit requests. MMEMME brings the material facts and next
        actions into one supported workflow.
      </p>
      <h2>Our starting point</h2>
      <p>
        We are deliberately narrow: Lagos weddings, venues and caterers, and naira payments. This
        lets our team curate supply and learn from real bookings before expanding the product.
      </p>
      <h2>Our standard</h2>
      <p>
        We would rather show a shorter honest list than a large directory padded with unreviewed
        suppliers or invented proof.
      </p>
    </ContentPage>
  );
}
