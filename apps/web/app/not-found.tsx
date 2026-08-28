import Link from "next/link";
export default function NotFound() {
  return (
    <main className="state-page" id="main">
      <p className="eyebrow">404 · Not found</p>
      <h1>This page missed the guest list.</h1>
      <p>The link may have changed, or the vendor may no longer be published.</p>
      <div>
        <Link className="button primary" href="/search">
          Search the marketplace
        </Link>
        <Link className="text-link" href="/">
          Return home
        </Link>
      </div>
    </main>
  );
}
