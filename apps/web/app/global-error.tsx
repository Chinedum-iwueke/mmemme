"use client";
import Link from "next/link";
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en-NG">
      <body>
        <main className="state-page">
          <p className="eyebrow">Something went wrong</p>
          <h1>We couldn’t hold this page together.</h1>
          <p>Try the page again. If it keeps happening, return home or contact MMEMME support.</p>
          <div>
            <button className="button primary" onClick={reset}>
              Try again
            </button>
            <Link className="text-link" href="/">
              Return home
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
