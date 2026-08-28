import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Icon } from "../../../components/public/icons";
import { VendorGrid, VerificationPanel } from "../../../components/public/marketplace";
import { dateLabel, getPublicVendor, listPublicVendors, money } from "../../../lib/marketplace";
type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ returnTo?: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const vendor = await getPublicVendor((await params).id);
  if (!vendor) return { title: "Vendor not found" };
  return {
    title: `${vendor.name} — ${vendor.category} in ${vendor.area}`,
    description: `${vendor.description.slice(0, 145)} Price guidance ${money(vendor.price_from_kobo)}.`,
    alternates: { canonical: `/vendors/${vendor.id}` },
    openGraph: {
      title: vendor.name,
      description: vendor.description,
      images: vendor.imageUrl
        ? [{ url: vendor.imageUrl, width: 1200, height: 800, alt: `${vendor.name} portfolio` }]
        : ["/opengraph-image"],
    },
  };
}
export default async function VendorPage({ params, searchParams }: Props) {
  const vendor = await getPublicVendor((await params).id);
  if (!vendor) notFound();
  const { returnTo } = await searchParams;
  const { vendors: related } = await listPublicVendors({ category: vendor.category });
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: vendor.name,
    description: vendor.description,
    areaServed: vendor.area,
    url: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3001"}/vendors/${vendor.id}`,
    priceRange: money(vendor.price_from_kobo),
  };
  return (
    <main id="main">
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replaceAll("<", "\\u003c") }}
        type="application/ld+json"
      />
      <div className="shell profile-breadcrumb">
        <Link href={returnTo?.startsWith("/") ? returnTo : `/${vendor.category}s`}>
          ← Back to {vendor.category === "venue" ? "venues" : "caterers"}
        </Link>
      </div>
      <section className="shell profile-hero">
        <div className="profile-image">
          {vendor.imageUrl ? (
            <Image
              alt={`${vendor.name} portfolio`}
              fill
              priority
              sizes="(max-width: 899px) calc(100vw - 40px), 65vw"
              src={vendor.imageUrl}
            />
          ) : (
            <div className="image-placeholder">
              <span>{vendor.name.charAt(0)}</span>
            </div>
          )}
        </div>
        <div className="profile-summary">
          <p className="trust-line">
            <Icon name="shield" /> MMEMME Verified
          </p>
          <p className="eyebrow">
            {vendor.category} · {vendor.area}
          </p>
          <h1>{vendor.name}</h1>
          <div className="profile-facts">
            <p>
              <span>Price guidance</span>
              <strong>{money(vendor.price_from_kobo)}</strong>
            </p>
            <p>
              <span>Guest capacity</span>
              <strong>
                {vendor.capacity_min || vendor.capacity_max
                  ? `${vendor.capacity_min ?? 1}–${vendor.capacity_max ?? "ask"}`
                  : "Ask MMEMME"}
              </strong>
            </p>
            <p>
              <span>Verification</span>
              <strong>Checked {dateLabel(vendor.verification?.checked_at ?? null)}</strong>
            </p>
          </div>
          <p className="availability-note">
            Availability is not live. MMEMME confirms your date and final terms after your request.
          </p>
          <Link
            className="button primary wide-button"
            href={`/login?next=${encodeURIComponent(`/vendors/${vendor.id}/request`)}`}
          >
            Sign in to request this vendor
          </Link>
        </div>
      </section>
      <section className="shell profile-content">
        <div>
          <p className="eyebrow">About this service</p>
          <h2>The useful details, up front</h2>
          <p className="profile-description">{vendor.description}</p>
          <h2>Packages</h2>
          {vendor.packages.length ? (
            <div className="package-list">
              {vendor.packages.map((item) => (
                <article key={item.id}>
                  <div>
                    <h3>{item.name}</h3>
                    <p>{item.description}</p>
                  </div>
                  <strong>{money(item.price_from_kobo)}</strong>
                  {item.guest_min || item.guest_max ? (
                    <p>
                      {item.guest_min ?? 1}–{item.guest_max ?? "ask"} guests
                    </p>
                  ) : null}
                  {item.inclusions.length ? (
                    <ul>
                      {item.inclusions.map((inclusion) => (
                        <li key={inclusion}>
                          <Icon name="check" />
                          {inclusion}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <div className="inline-empty">
              Package details are being normalized. MMEMME will provide complete inclusions before
              you accept a quote.
            </div>
          )}
          <section className="policy-preview">
            <h2>Cancellation terms</h2>
            <p>
              The exact cancellation consequences are shown in your expiring quote before
              acceptance. They vary by category, package and event date. No payment is requested
              until you can review them.
            </p>
            <Link href="/refunds-cancellations">Read the policy framework</Link>
          </section>
        </div>
        <VerificationPanel vendor={vendor} />
      </section>
      {related.filter((item) => item.id !== vendor.id).length > 0 && (
        <section className="section-tint">
          <div className="shell section-block">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Also curated</p>
                <h2>More {vendor.category === "venue" ? "venues" : "caterers"}</h2>
              </div>
            </div>
            <VendorGrid vendors={related.filter((item) => item.id !== vendor.id).slice(0, 3)} />
          </div>
        </section>
      )}
    </main>
  );
}
