import type { Metadata } from "next";
import { ResultsPage } from "../../components/public/results";
export const metadata: Metadata = {
  title: "Wedding caterers in Lagos",
  description: "Explore curated Lagos wedding caterers with package and price guidance.",
  alternates: { canonical: "/caterers" },
};
export default function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <ResultsPage fixedCategory="caterer" searchParams={searchParams} />;
}
