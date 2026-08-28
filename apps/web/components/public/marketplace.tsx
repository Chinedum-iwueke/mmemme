import Link from "next/link";
import Image from "next/image";
import type { PublicVendor } from "../../lib/marketplace";
import { dateLabel, money } from "../../lib/marketplace";
import { Icon } from "./icons";
import { ShortlistButton } from "../customer/shortlist-button";

export function SearchForm({
  category,
  area,
  guests,
  date,
}: {
  category?: string;
  area?: string;
  guests?: string;
  date?: string;
}) {
  return (
    <form action="/search" className="market-search">
      <label>
        <span>What do you need?</span>
        <select defaultValue={category ?? ""} name="category">
          <option value="">Venues and caterers</option>
          <option value="venue">A wedding venue</option>
          <option value="caterer">A caterer</option>
        </select>
      </label>
      <label>
        <span>Lagos area</span>
        <input defaultValue={area} name="area" placeholder="Lekki, Ikeja, Victoria Island" />
      </label>
      <label>
        <span>Wedding date</span>
        <input defaultValue={date} name="date" type="date" />
      </label>
      <label>
        <span>Guests</span>
        <input
          defaultValue={guests}
          inputMode="numeric"
          min="1"
          name="guests"
          placeholder="e.g. 250"
          type="number"
        />
      </label>
      <button type="submit">
        <Icon name="search" />
        Search curated vendors
      </button>
    </form>
  );
}

export function VendorCard({ vendor, returnTo }: { vendor: PublicVendor; returnTo?: string }) {
  const href = `/vendors/${vendor.id}${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ""}`;
  return (
    <article className="vendor-card">
      <ShortlistButton vendorId={vendor.id} />
      <Link aria-label={`View ${vendor.name}`} className="vendor-image" href={href}>
        {vendor.imageUrl ? (
          <Image
            alt={`${vendor.name} portfolio`}
            fill
            sizes="(max-width: 599px) calc(100vw - 28px), (max-width: 899px) 50vw, 33vw"
            src={vendor.imageUrl}
          />
        ) : (
          <div className="image-placeholder" aria-hidden="true">
            <span>{vendor.name.charAt(0)}</span>
          </div>
        )}
        <span className="category-label">{vendor.category}</span>
      </Link>
      <div className="vendor-card-body">
        <p className="trust-line">
          <Icon name="shield" /> MMEMME Verified
        </p>
        <h3>
          <Link href={href}>{vendor.name}</Link>
        </h3>
        <p className="facts">
          <Icon name="location" /> {vendor.area}
          {vendor.capacity_max ? (
            <>
              <span>·</span>
              <Icon name="users" /> Up to {vendor.capacity_max.toLocaleString()} guests
            </>
          ) : null}
        </p>
        <div className="card-price">
          <span>Guidance from</span>
          <strong>{money(vendor.price_from_kobo)}</strong>
        </div>
      </div>
    </article>
  );
}

export function VendorGrid({ vendors, returnTo }: { vendors: PublicVendor[]; returnTo?: string }) {
  return vendors.length ? (
    <div className="vendor-grid">
      {vendors.map((vendor) => (
        <VendorCard key={vendor.id} returnTo={returnTo} vendor={vendor} />
      ))}
    </div>
  ) : (
    <div className="market-empty">
      <p className="eyebrow">Curating carefully</p>
      <h2>No approved matches yet</h2>
      <p>
        Try a broader Lagos area or category. We do not pad search results with vendors who have not
        completed our review.
      </p>
      <Link className="text-link" href="/search">
        Clear search filters <Icon name="arrow" />
      </Link>
    </div>
  );
}

export function VerificationPanel({ vendor }: { vendor: PublicVendor }) {
  const expired = vendor.verification_expires_at
    ? new Date(vendor.verification_expires_at) < new Date()
    : true;
  const checks = vendor.verification
    ? ([
        ["Identity", vendor.verification.identity_checked],
        ["Contact details", vendor.verification.contact_checked],
        ["Bank name", vendor.verification.bank_name_checked],
        ["Operating authority", vendor.verification.authority_checked],
        ["Portfolio ownership", vendor.verification.portfolio_checked],
        ["References", vendor.verification.references_checked],
        ["Physical site", vendor.verification.physical_site_checked],
      ] as const)
    : [];
  return (
    <section className={`verification-panel ${expired ? "expired" : ""}`}>
      <div>
        <p className="eyebrow">MMEMME Verified</p>
        <h2>{expired ? "Verification needs renewal" : "What we checked"}</h2>
        <p>
          {expired
            ? "This vendor’s recorded verification date has expired. MMEMME will re-check it before processing a new request."
            : (vendor.verification?.public_note ??
              "MMEMME recorded the standard vendor verification checks.")}
        </p>
        <p className="verification-date">
          Checked {dateLabel(vendor.verification?.checked_at ?? null)} ·{" "}
          {expired ? "Expired" : `Valid until ${dateLabel(vendor.verification_expires_at)}`}
        </p>
      </div>
      {checks.length > 0 && (
        <ul>
          {checks.map(([label, checked]) => (
            <li key={label}>
              <Icon name={checked ? "check" : "close"} />
              {label}
              <strong>{checked ? "Checked" : "Not recorded"}</strong>
            </li>
          ))}
        </ul>
      )}
      <p className="disclosure">
        Verification describes checks MMEMME recorded. It is not a guarantee of service quality,
        availability or fulfilment.
      </p>
    </section>
  );
}
