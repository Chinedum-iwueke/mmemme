import type { Metadata } from "next";
import { ResultsPage } from "../../components/public/results";
export const metadata: Metadata = {
  title: "Wedding venues in Lagos",
  description: "Explore curated Lagos wedding venues with capacity and price guidance.",
  alternates: { canonical: "/venues" },
};
export default function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <ResultsPage fixedCategory="venue" searchParams={searchParams} />;
}
