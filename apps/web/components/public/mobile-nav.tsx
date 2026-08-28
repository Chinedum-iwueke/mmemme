"use client";
import { useState } from "react";
import Link from "next/link";
import { Icon } from "./icons";
export function MobileNav() {
  const [open, setOpen] = useState(false);
  return (
    <div className="mobile-nav">
      <button
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? "Close menu" : "Open menu"}
        className="icon-button"
        onClick={() => setOpen(!open)}
      >
        <Icon name={open ? "close" : "menu"} />
      </button>
      {open && (
        <nav aria-label="Mobile" className="mobile-menu" id="mobile-menu">
          <Link href="/venues">Venues</Link>
          <Link href="/caterers">Caterers</Link>
          <Link href="/how-it-works">How it works</Link>
          <Link href="/verification">Verification</Link>
          <Link href="/for-vendors">For vendors</Link>
          <Link href="/brief">Wedding brief</Link>
          <Link href="/shortlist">Shortlist</Link>
          <Link href="/bookings">My bookings</Link>
          <Link className="nav-action" href="/login">
            Sign in
          </Link>
        </nav>
      )}
    </div>
  );
}
