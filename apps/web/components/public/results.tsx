import Link from "next/link";
import { Pagination } from "../ui";
import { PAGE_SIZE, listPublicVendors, type MarketplaceQuery } from "../../lib/marketplace";
import { SearchForm, VendorGrid } from "./marketplace";
type Params = Record<string, string | string[] | undefined>;
const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
export async function ResultsPage({
  searchParams,
  fixedCategory,
}: {
  searchParams: Promise<Params>;
  fixedCategory?: "venue" | "caterer";
}) {
  const raw = await searchParams;
  const categoryValue = fixedCategory ?? one(raw.category);
  const query: MarketplaceQuery = {
    category: categoryValue === "venue" || categoryValue === "caterer" ? categoryValue : undefined,
    area: one(raw.area)?.trim() || undefined,
    guests: Number(one(raw.guests)) > 0 ? Number(one(raw.guests)) : undefined,
    sort: ["price-low", "capacity"].includes(one(raw.sort) ?? "")
      ? (one(raw.sort) as MarketplaceQuery["sort"])
      : "curated",
    page: Math.max(1, Number(one(raw.page)) || 1),
  };
  const { vendors, count } = await listPublicVendors(query);
  const weddingDate = one(raw.date);
  const base = fixedCategory ? `/${fixedCategory}s` : "/search";
  const preserved = new URLSearchParams();
  Object.entries(raw).forEach(([key, value]) => {
    if (typeof value === "string" && key !== "page") preserved.set(key, value);
  });
  const pageHref = (page: number) => {
    const next = new URLSearchParams(preserved);
    next.set("page", String(page));
    return `${base}?${next}`;
  };
  const returnTo = `${base}?${new URLSearchParams(Object.entries(raw).flatMap(([key, value]) => (typeof value === "string" ? [[key, value]] : []))).toString()}`;
  const heading =
    fixedCategory === "venue"
      ? "Wedding venues in Lagos"
      : fixedCategory === "caterer"
        ? "Wedding caterers in Lagos"
        : "Curated wedding vendors";
  const FilterForm = () => (
    <form>
      <input name="category" type="hidden" value={fixedCategory ?? query.category ?? ""} />
      {weddingDate && <input name="date" type="hidden" value={weddingDate} />}
      <label>
        Area
        <input defaultValue={query.area} name="area" placeholder="Any Lagos area" />
      </label>
      <label>
        Minimum capacity
        <input defaultValue={query.guests} min="1" name="guests" type="number" />
      </label>
      <label>
        Sort
        <select defaultValue={query.sort} name="sort">
          <option value="curated">Recently curated</option>
          <option value="price-low">Lowest price guidance</option>
          <option value="capacity">Largest capacity</option>
        </select>
      </label>
      <button className="button primary" type="submit">
        Apply filters
      </button>
      <Link href={base}>Clear filters</Link>
    </form>
  );
  return (
    <main id="main">
      <section className="results-hero">
        <div className="shell">
          <p className="eyebrow">Search the marketplace</p>
          <h1>{heading}</h1>
          <p>
            Published suppliers have completed MMEMME’s recorded verification checks. Dates are
            confirmed only after a booking request.
          </p>
          <SearchForm
            area={query.area}
            category={query.category}
            date={weddingDate}
            guests={query.guests?.toString()}
          />
        </div>
      </section>
      <div className="shell results-layout">
        <aside className="filters" aria-label="Search filters">
          <FilterForm />
        </aside>
        <section className="results" aria-live="polite">
          <div className="result-summary">
            <div>
              <p className="eyebrow">Approved supply only</p>
              <h2>
                {count} {count === 1 ? "result" : "results"}
              </h2>
            </div>
            <details className="mobile-filters">
              <summary>Filter and sort</summary>
              <FilterForm />
            </details>
          </div>
          <VendorGrid returnTo={returnTo} vendors={vendors} />
          {count > PAGE_SIZE && (
            <Pagination
              current={query.page ?? 1}
              hrefForPage={pageHref}
              total={Math.ceil(count / PAGE_SIZE)}
            />
          )}
        </section>
      </div>
    </main>
  );
}
