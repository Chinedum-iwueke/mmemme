import type { Metadata, Viewport } from "next";
import { Footer, Header } from "../components/public/shell";
import "@mmemme/tokens/tokens.css";
import "./styles.css";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001";
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "MMEMME — Curated Lagos wedding venues and caterers", template: "%s · MMEMME" },
  description:
    "Find curated Lagos wedding venues and caterers, understand complete terms, and request a supported booking.",
  applicationName: "MMEMME",
  alternates: { canonical: "/" },
  openGraph: { type: "website", locale: "en_NG", siteName: "MMEMME", images: ["/opengraph-image"] },
  twitter: { card: "summary_large_image" },
};
export const viewport: Viewport = { themeColor: "#294A41", colorScheme: "light" };
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-NG">
      <body>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
