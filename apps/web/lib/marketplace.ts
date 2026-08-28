import { createClient } from "@supabase/supabase-js";
import type { Database } from "@mmemme/database";

export type VendorCategory = "venue" | "caterer";
export type PublicVendor = Database["public"]["Tables"]["vendors"]["Row"] & {
  packages: Database["public"]["Tables"]["service_packages"]["Row"][];
  verification: Omit<
    Database["public"]["Tables"]["verification_records"]["Row"],
    "private_note" | "checked_by"
  > | null;
  imageUrl: string | null;
};

export type MarketplaceQuery = {
  category?: VendorCategory;
  area?: string;
  guests?: number;
  sort?: "curated" | "price-low" | "capacity";
  page?: number;
};

export const PAGE_SIZE = 9;
const configured = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

function publicClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}

function publicImage(path: string | null) {
  if (!path || !configured()) return null;
  return publicClient()
    .storage.from("vendor-media")
    .getPublicUrl(path, { transform: { width: 1200, quality: 76 } }).data.publicUrl;
}

export async function listPublicVendors(query: MarketplaceQuery = {}) {
  if (!configured()) return { vendors: [] as PublicVendor[], count: 0 };
  const page = Math.max(1, query.page ?? 1);
  let request = publicClient()
    .from("vendors")
    .select("*,service_packages(*)", { count: "exact" })
    .eq("published", true)
    .eq("verification_status", "approved");
  if (query.category) request = request.eq("category", query.category);
  if (query.area) request = request.ilike("area", `%${query.area}%`);
  if (query.guests) request = request.gte("capacity_max", query.guests);
  if (query.sort === "price-low")
    request = request.order("price_from_kobo", { ascending: true, nullsFirst: false });
  else if (query.sort === "capacity")
    request = request.order("capacity_max", { ascending: false, nullsFirst: false });
  else request = request.order("updated_at", { ascending: false });
  const { data, count, error } = await request.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (error) return { vendors: [] as PublicVendor[], count: 0 };
  return {
    count: count ?? 0,
    vendors: (data ?? []).map(({ service_packages, ...vendor }) => ({
      ...vendor,
      packages: service_packages.filter((item) => item.active),
      verification: null,
      imageUrl: publicImage(vendor.hero_image_path),
    })),
  };
}

export async function getPublicVendor(id: string): Promise<PublicVendor | null> {
  if (!configured()) return null;
  const client = publicClient();
  const [{ data: vendor }, { data: verification }] = await Promise.all([
    client
      .from("vendors")
      .select("*,service_packages(*)")
      .eq("id", id)
      .eq("published", true)
      .eq("verification_status", "approved")
      .maybeSingle(),
    client
      .from("verification_records")
      .select(
        "id,vendor_id,status,identity_checked,contact_checked,bank_name_checked,authority_checked,portfolio_checked,references_checked,physical_site_checked,checked_at,expires_at,created_at,public_note",
      )
      .eq("vendor_id", id)
      .eq("status", "approved")
      .order("checked_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  if (!vendor) return null;
  const { service_packages, ...row } = vendor;
  return {
    ...row,
    packages: service_packages.filter((item) => item.active),
    verification: verification ?? null,
    imageUrl: publicImage(row.hero_image_path),
  };
}

export const money = (kobo: number | null) =>
  kobo == null
    ? "Price on request"
    : new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        maximumFractionDigits: 0,
      }).format(kobo / 100);
export const dateLabel = (date: string | null) =>
  date
    ? new Intl.DateTimeFormat("en-NG", { dateStyle: "medium" }).format(new Date(date))
    : "Not recorded";
