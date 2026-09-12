import type { PackageRow, VendorRow, VerificationDisclosure } from "./database.types";
import type { ImageSourcePropType } from "react-native";
import { isSupabaseConfigured, mobileEnvironment, supabase } from "./supabase";

const demoVendorHeroSources: Record<string, ImageSourcePropType> = {
  "10000000-0000-4000-8000-000000000001": require("../../assets/editorial/lagoon-house.webp"),
  "10000000-0000-4000-8000-000000000002": require("../../assets/editorial/the-assembly.webp"),
  "10000000-0000-4000-8000-000000000003": require("../../assets/editorial/adunni-table.webp"),
  "10000000-0000-4000-8000-000000000004": require("../../assets/editorial/ife-kitchen.webp"),
};

export type Vendor = VendorRow & {
  packages: PackageRow[];
  verification: VerificationDisclosure | null;
  heroSource: ImageSourcePropType | null;
};
export type VendorFilters = {
  category?: "venue" | "caterer";
  area?: string;
  guestCount?: number;
  maxPriceKobo?: number;
};

export async function listVendors(filters: VendorFilters = {}): Promise<Vendor[]> {
  if (!isSupabaseConfigured) throw new Error("MMEMME has not been connected to Supabase yet.");
  let query = supabase
    .from("vendors")
    .select(
      "id,name,category,area,description,capacity_min,capacity_max,price_from_kobo,hero_image_path,verification_expires_at,published",
    )
    .eq("published", true)
    .order("name");
  if (filters.category) query = query.eq("category", filters.category);
  if (filters.area) query = query.ilike("area", `%${filters.area}%`);
  if (filters.guestCount)
    query = query.or(`capacity_max.is.null,capacity_max.gte.${filters.guestCount}`);
  if (filters.maxPriceKobo) query = query.lte("price_from_kobo", filters.maxPriceKobo);
  const { data: vendors, error } = await query.range(0, 24);
  if (error) throw error;
  const ids = (vendors ?? []).map((vendor) => vendor.id);
  if (!ids.length) return [];
  const [{ data: packages }, { data: disclosures }] = await Promise.all([
    supabase
      .from("service_packages")
      .select("id,vendor_id,name,description,price_from_kobo,inclusions,active")
      .in("vendor_id", ids)
      .eq("active", true),
    supabase.from("vendor_verification_disclosures").select("*").in("vendor_id", ids),
  ]);
  return (vendors as VendorRow[]).map((vendor) => ({
    ...vendor,
    packages:
      (packages as PackageRow[] | null)?.filter((item) => item.vendor_id === vendor.id) ?? [],
    verification:
      (disclosures as VerificationDisclosure[] | null)?.find(
        (item) => item.vendor_id === vendor.id,
      ) ?? null,
    heroSource:
      (mobileEnvironment.EXPO_PUBLIC_DEMO_MODE && demoVendorHeroSources[vendor.id]) ||
      (vendor.hero_image_path
        ? {
            uri: supabase.storage.from("vendor-portfolios").getPublicUrl(vendor.hero_image_path)
              .data.publicUrl,
          }
        : null),
  }));
}

export async function getVendor(id: string) {
  return (await listVendors()).find((vendor) => vendor.id === id) ?? null;
}
