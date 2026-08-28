import type { Metadata } from "next";
import { ResultsPage } from "../../components/public/results";
export const metadata: Metadata = {
  title: "Search wedding vendors",
  robots: { index: false, follow: true },
};
export default function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return <ResultsPage searchParams={searchParams} />;
}
