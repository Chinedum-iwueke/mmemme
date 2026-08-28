"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { browserClient } from "../../lib/supabase/browser";
export function AccountNav() {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    browserClient()
      .auth.getSession()
      .then(({ data }) => setSignedIn(Boolean(data.session)));
    const { data } = browserClient().auth.onAuthStateChange((_event, session) =>
      setSignedIn(Boolean(session)),
    );
    return () => data.subscription.unsubscribe();
  }, []);
  async function signOut() {
    await browserClient().auth.signOut({ scope: "local" });
    location.assign("/");
  }
  return (
    <div className="account-nav">
      <Link href="/shortlist">Shortlist</Link>
      <Link href="/bookings">My bookings</Link>
      {signedIn ? (
        <button className="nav-link-button" onClick={signOut}>
          Sign out
        </button>
      ) : (
        <Link className="nav-action" href="/login">
          Sign in
        </Link>
      )}
    </div>
  );
}
