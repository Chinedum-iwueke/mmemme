import type { Metadata } from "next";
import "./styles.css";
import "@mmemme/tokens/tokens.css";
export const metadata: Metadata = {
  title: "MMEMME — Events, brought together",
  description: "Discover curated Lagos wedding venues and caterers.",
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
