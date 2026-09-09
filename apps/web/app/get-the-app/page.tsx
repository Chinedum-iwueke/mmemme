import Link from "next/link";
import { BrandLogo } from "../../components/public/brand-logo";

export const metadata = {
  title: "Get the MMEMME app",
  description: "Take your MMEMME wedding search, shortlist and bookings with you.",
};

function configuredStore(value: string | undefined, hostname: string) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === hostname ? url.toString() : null;
  } catch {
    return null;
  }
}

export default async function GetTheAppPage({
  searchParams,
}: {
  searchParams: Promise<{ platform?: string }>;
}) {
  const { platform } = await searchParams;
  const ios = configuredStore(process.env.NEXT_PUBLIC_IOS_APP_STORE_URL, "apps.apple.com");
  const android = configuredStore(process.env.NEXT_PUBLIC_GOOGLE_PLAY_STORE_URL, "play.google.com");
  const available = Boolean(ios || android);
  return (
    <main className="app-store-page" id="main">
      <section className="app-store-card">
        <BrandLogo />
        <p className="eyebrow">MMEMME in your pocket</p>
        <h1>{available ? "Choose your app store." : "The mobile app is coming to closed beta."}</h1>
        <p>
          Search curated Lagos venues and caterers, save favourites, send booking requests and
          follow every quote from one place.
        </p>
        {available ? (
          <div className="store-actions">
            {ios && (
              <a className="store-button" href={ios} rel="noreferrer">
                <span>Download on the</span>
                <strong>App Store</strong>
              </a>
            )}
            {android && (
              <a className="store-button" href={android} rel="noreferrer">
                <span>Get it on</span>
                <strong>Google Play</strong>
              </a>
            )}
          </div>
        ) : (
          <div className="store-coming-soon">
            <strong>
              {platform === "ios"
                ? "The iPhone beta is not open yet."
                : platform === "android"
                  ? "The Android beta is not open yet."
                  : "App-store testing is not open yet."}
            </strong>
            <p>
              Use the complete web app today, or contact us to join the first mobile test group.
            </p>
            <div className="store-actions">
              <Link className="button primary" href="/">
                Continue on the web
              </Link>
              <Link className="button secondary" href="/contact">
                Join the mobile beta
              </Link>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
