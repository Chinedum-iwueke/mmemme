import Link from "next/link";
import { AccountNav } from "../customer/account-nav";
import { MobileNav } from "./mobile-nav";
import { BrandLogo } from "./brand-logo";
export function Header() {
  return (
    <header className="site-header">
      <a className="skip-link" href="#main">
        Skip to main content
      </a>
      <div className="app-download-banner">
        <div className="shell app-download-inner">
          <p>
            <strong>Take your wedding plans with you.</strong>
            <span> Search, shortlist and manage bookings in the MMEMME app.</span>
          </p>
          <Link className="app-download-link" href="/get-app">
            Get the app <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
      <div className="shell header-inner">
        <Link className="wordmark" href="/" aria-label="MMEMME home">
          <BrandLogo priority />
        </Link>
        <nav aria-label="Primary" className="desktop-nav">
          <Link href="/venues">Venues</Link>
          <Link href="/caterers">Caterers</Link>
          <Link href="/how-it-works">How it works</Link>
          <Link href="/verification">Verification</Link>
          <Link href="/for-vendors">For vendors</Link>
        </nav>
        <AccountNav />
        <MobileNav />
      </div>
    </header>
  );
}
export function Footer() {
  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div>
          <Link className="wordmark inverse" href="/">
            <BrandLogo treatment="lime" />
          </Link>
          <p>Curated Lagos wedding venues and caterers, with clear terms and supported booking.</p>
        </div>
        <nav aria-label="Marketplace">
          <h2>Discover</h2>
          <Link href="/venues">Venues</Link>
          <Link href="/caterers">Caterers</Link>
          <Link href="/how-it-works">How it works</Link>
          <Link href="/verification">Verification & safety</Link>
        </nav>
        <nav aria-label="Company">
          <h2>Company</h2>
          <Link href="/about">About</Link>
          <Link href="/for-vendors">For vendors</Link>
          <Link href="/contact">Contact</Link>
        </nav>
        <nav aria-label="Legal">
          <h2>Legal</h2>
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/refunds-cancellations">Refunds & cancellations</Link>
          <Link href="/disputes">Disputes</Link>
        </nav>
      </div>
      <div className="shell footer-base">
        <span>© {new Date().getFullYear()} MMEMME</span>
        <span>Lagos, Nigeria · Naira payments only</span>
      </div>
    </footer>
  );
}
