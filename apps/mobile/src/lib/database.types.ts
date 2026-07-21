export type VendorRow = {
  id: string; name: string; category: "venue" | "caterer"; area: string;
  description: string; capacity_min: number | null; capacity_max: number | null;
  price_from_kobo: number | null; hero_image_path: string | null;
  verification_expires_at: string | null; published: boolean;
};
export type PackageRow = {
  id: string; vendor_id: string; name: string; description: string;
  price_from_kobo: number; inclusions: string[]; active: boolean;
};
export type VerificationDisclosure = {
  vendor_id: string; identity_checked: boolean; contact_checked: boolean;
  bank_name_checked: boolean; authority_checked: boolean; portfolio_checked: boolean;
  references_checked: boolean; physical_site_checked: boolean;
  checked_at: string | null; expires_at: string | null; public_note: string;
};
export type ProfileRow = { id: string; full_name: string; phone: string | null; email: string | null; is_admin: boolean };
