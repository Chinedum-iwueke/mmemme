import type { Database } from "@mmemme/database";
export type VendorRow = Database["public"]["Tables"]["vendors"]["Row"];
export type PackageRow = Database["public"]["Tables"]["service_packages"]["Row"];
export type VerificationDisclosure =
  Database["public"]["Views"]["vendor_verification_disclosures"]["Row"];
export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
