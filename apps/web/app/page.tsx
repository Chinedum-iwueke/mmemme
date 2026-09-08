import Link from "next/link";
import Image from "next/image";
import { Icon } from "../components/public/icons";
import { SearchForm, VendorGrid } from "../components/public/marketplace";
import { listPublicVendors } from "../lib/marketplace";
export const revalidate = 300;
export default async function Home() {
  const [{ vendors: venues }, { vendors: caterers }] = await Promise.all([
    listPublicVendors({ category: "venue" }),
    listPublicVendors({ category: "caterer" }),
  ]);
  return (
    <main id="main">
      <section className="home-hero">
        <Image
          alt="A contemporary Lagos wedding celebration overlooking the lagoon at golden hour"
          className="hero-image"
          fill
          priority
          sizes="100vw"
          src="/images/editorial/lagos-wedding-hero.webp"
        />
        <div className="hero-shade" aria-hidden="true" />
        <div className="shell hero-copy">
          <p className="eyebrow">Lagos weddings, brought together</p>
          <h1>
            Find the place.
            <br />
            <span>Book with clarity.</span>
          </h1>
          <p className="hero-intro">
            A shorter list of curated venues and caterers, clear package guidance, and a
            human-supported path from request to confirmed booking.
          </p>
          <SearchForm />
          <p className="availability-note">
            We confirm availability with each vendor after you request a booking.
          </p>
        </div>
      </section>
      <section className="shell section-block">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Curated places</p>
            <h2>Venues worth seeing first</h2>
          </div>
          <Link className="text-link" href="/venues">
            Explore all venues <Icon name="arrow" />
          </Link>
        </div>
        <VendorGrid vendors={venues.slice(0, 3)} />
      </section>
      <section className="section-tint">
        <div className="shell section-block">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Food people remember</p>
              <h2>Caterers for the whole table</h2>
            </div>
            <Link className="text-link" href="/caterers">
              Explore all caterers <Icon name="arrow" />
            </Link>
          </div>
          <VendorGrid vendors={caterers.slice(0, 3)} />
        </div>
      </section>
      <section className="shell trust-story">
        <div>
          <p className="eyebrow">A clearer way to book</p>
          <h2>Know what was checked—and what happens next.</h2>
        </div>
        <div className="steps">
          <article>
            <span>01</span>
            <h3>Tell us the shape of your day</h3>
            <p>Search by category, Lagos area, date and guest count without creating an account.</p>
          </article>
          <article>
            <span>02</span>
            <h3>Compare the facts that matter</h3>
            <p>
              See price guidance, capacity, package inclusions and exactly what verification
              recorded.
            </p>
          </article>
          <article>
            <span>03</span>
            <h3>Request, then confirm</h3>
            <p>
              MMEMME checks the date and terms with the vendor before issuing a quote. Search never
              implies live availability.
            </p>
          </article>
        </div>
        <Link className="button secondary" href="/how-it-works">
          See how booking works
        </Link>
      </section>
      <section className="vendor-cta">
        <div className="shell">
          <p className="eyebrow">For Lagos venues and caterers</p>
          <h2>Bring your best work to a better booking process.</h2>
          <p>
            Vendor onboarding is managed by MMEMME. Tell us about your business and we’ll explain
            the verification steps.
          </p>
          <Link className="button accent" href="/for-vendors">
            Apply to join MMEMME <Icon name="arrow" />
          </Link>
        </div>
      </section>
    </main>
  );
}
