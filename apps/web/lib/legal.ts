import type { Metadata } from "next";
export const legalMetadata = (title: string, path: string): Metadata => ({
  title,
  alternates: { canonical: path },
  robots:
    process.env.NEXT_PUBLIC_LEGAL_CONTENT_STATUS === "approved"
      ? { index: true, follow: true }
      : { index: false, follow: false },
});
export const legalVersion = "draft-2026-08-28";
