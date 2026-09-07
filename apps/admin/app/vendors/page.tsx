import Link from "next/link";
import {
  approveVerification,
  createPackage,
  createVendor,
  setPublished,
  updatePackage,
  updateVendor,
} from "./actions";
import { createAdminClient, requireAdmin } from "../../lib/supabase/server";
import "./vendors.css";

const money = (kobo: number | null) => (kobo ? Math.round(kobo / 100) : 0);
export default async function VendorsPage() {
  await requireAdmin("vendors");
  const client = createAdminClient();
  const [{ data: vendors }, { data: packages }] = await Promise.all([
    client
      .from("vendors")
      .select(
        "id,name,category,area,description,capacity_min,capacity_max,verification_status,published,price_from_kobo",
      )
      .order("created_at", { ascending: false }),
    client
      .from("service_packages")
      .select("id,vendor_id,name,description,price_from_kobo,guest_min,guest_max,active")
      .order("created_at"),
  ]);
  return (
    <div className="ops-page">
      <header className="ops-top">
        <div>
          <p className="eyebrow">Supply operations</p>
          <h1>Vendors and verification</h1>
        </div>
        <nav className="ops-links">
          <Link href="/vendors/applications">Vendor applications</Link>
          <Link href="/">Dashboard</Link>
        </nav>
      </header>
      <div className="ops-grid">
        <section className="panel">
          <h2>Add a vendor</h2>
          <p className="muted">
            New vendors remain private until every verification check is attested.
          </p>
          <form action={createVendor} className="form two-column">
            <VendorInputs />
            <button className="primary span-two">Create private vendor</button>
          </form>
        </section>
        <section className="panel">
          <h2>Supply queue</h2>
          <div className="vendor-list">
            {vendors?.map((v) => (
              <article className="vendor-row" key={v.id}>
                <div>
                  <strong>{v.name}</strong>
                  <p>
                    {v.category} · {v.area} · ₦{money(v.price_from_kobo).toLocaleString("en-NG")}
                  </p>
                  <span className={`status ${v.verification_status}`}>{v.verification_status}</span>
                  {v.published && <span className="status live-status">published</span>}
                </div>
                <div className="vendor-actions">
                  {v.verification_status !== "approved" && (
                    <form action={approveVerification}>
                      <input type="hidden" name="vendorId" value={v.id} />
                      <label className="attest">
                        <input type="checkbox" name="attested" value="yes" required /> All seven
                        checks completed
                      </label>
                      <button className="secondary">Approve verification</button>
                    </form>
                  )}
                  {v.verification_status === "approved" && (
                    <form action={setPublished}>
                      <input type="hidden" name="vendorId" value={v.id} />
                      <input
                        type="hidden"
                        name="published"
                        value={v.published ? "false" : "true"}
                      />
                      <button className="secondary">{v.published ? "Unpublish" : "Publish"}</button>
                    </form>
                  )}
                </div>
                <details className="span-row">
                  <summary>Edit listing and packages</summary>
                  <form action={updateVendor} className="form two-column">
                    <input type="hidden" name="vendorId" value={v.id} />
                    <VendorInputs vendor={v} />
                    <button className="secondary span-two">Save and unpublish listing</button>
                  </form>
                  <h3>Packages</h3>
                  {packages
                    ?.filter((p) => p.vendor_id === v.id)
                    .map((p) => (
                      <form action={updatePackage} className="form package-form" key={p.id}>
                        <input type="hidden" name="packageId" value={p.id} />
                        <input type="hidden" name="vendorId" value={v.id} />
                        <PackageInputs value={p} />
                        <label>
                          State
                          <select name="active" defaultValue={String(p.active)}>
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                          </select>
                        </label>
                        <button className="secondary">Save package</button>
                      </form>
                    ))}
                  <form action={createPackage} className="form package-form">
                    <input type="hidden" name="vendorId" value={v.id} />
                    <PackageInputs />
                    <button className="primary">Add package</button>
                  </form>
                </details>
              </article>
            ))}
            {!vendors?.length && (
              <p className="empty">No vendors yet. Add the first inspected supplier.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
type Vendor = {
  name: string;
  category: string;
  area: string;
  description: string;
  capacity_min: number | null;
  capacity_max: number | null;
  price_from_kobo: number | null;
};
function VendorInputs({ vendor }: { vendor?: Vendor }) {
  return (
    <>
      <label>
        Name
        <input name="name" defaultValue={vendor?.name} required minLength={2} />
      </label>
      <label>
        Category
        <select name="category" defaultValue={vendor?.category ?? "venue"}>
          <option value="venue">Venue</option>
          <option value="caterer">Caterer</option>
        </select>
      </label>
      <label>
        Area
        <input name="area" defaultValue={vendor?.area} required />
      </label>
      <label>
        Price from (₦)
        <input
          name="priceNaira"
          defaultValue={vendor ? money(vendor.price_from_kobo) : undefined}
          required
          min={1}
          type="number"
        />
      </label>
      <label>
        Minimum capacity
        <input
          name="capacityMin"
          defaultValue={vendor?.capacity_min ?? undefined}
          required
          min={1}
          type="number"
        />
      </label>
      <label>
        Maximum capacity
        <input
          name="capacityMax"
          defaultValue={vendor?.capacity_max ?? undefined}
          required
          min={1}
          type="number"
        />
      </label>
      <label className="span-two">
        Public description
        <textarea
          name="description"
          defaultValue={vendor?.description}
          required
          minLength={20}
          rows={4}
        />
      </label>
    </>
  );
}
type Package = {
  name: string;
  description: string;
  price_from_kobo: number;
  guest_min: number | null;
  guest_max: number | null;
};
function PackageInputs({ value }: { value?: Package }) {
  return (
    <>
      <label>
        Package name
        <input name="name" defaultValue={value?.name} required />
      </label>
      <label>
        Price (₦)
        <input
          name="priceNaira"
          defaultValue={value ? money(value.price_from_kobo) : undefined}
          type="number"
          min={1}
          required
        />
      </label>
      <label>
        Guest minimum
        <input
          name="guestMin"
          defaultValue={value?.guest_min ?? undefined}
          type="number"
          min={1}
          required
        />
      </label>
      <label>
        Guest maximum
        <input
          name="guestMax"
          defaultValue={value?.guest_max ?? undefined}
          type="number"
          min={1}
          required
        />
      </label>
      <label className="package-description">
        Description
        <input name="description" defaultValue={value?.description} required minLength={10} />
      </label>
    </>
  );
}
