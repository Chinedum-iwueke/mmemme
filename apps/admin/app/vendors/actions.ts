"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient, requireAdmin } from "../../lib/supabase/server";

const VendorInput = z
  .object({
    name: z.string().trim().min(2).max(120),
    category: z.enum(["venue", "caterer"]),
    area: z.string().trim().min(2).max(80),
    description: z.string().trim().min(20).max(2000),
    capacityMin: z.coerce.number().int().min(1),
    capacityMax: z.coerce.number().int().min(1),
    priceNaira: z.coerce.number().int().positive(),
  })
  .refine((value) => value.capacityMax >= value.capacityMin, {
    message: "Maximum capacity must be at least minimum capacity",
  });
const PackageInput = z
  .object({
    vendorId: z.string().uuid(),
    name: z.string().trim().min(2).max(120),
    description: z.string().trim().min(10).max(1000),
    priceNaira: z.coerce.number().int().positive(),
    guestMin: z.coerce.number().int().min(1),
    guestMax: z.coerce.number().int().min(1),
  })
  .refine((value) => value.guestMax >= value.guestMin, {
    message: "Maximum guests must be at least minimum guests",
  });
export async function createVendor(formData: FormData) {
  const admin = await requireAdmin();
  const input = VendorInput.parse(Object.fromEntries(formData));
  const client = createAdminClient();
  const { data, error } = await client
    .from("vendors")
    .insert({
      name: input.name,
      category: input.category,
      area: input.area,
      description: input.description,
      capacity_min: input.capacityMin,
      capacity_max: input.capacityMax,
      price_from_kobo: input.priceNaira * 100,
      verification_status: "draft",
      published: false,
    })
    .select("id")
    .single();
  if (error) throw new Error("Could not create vendor");
  await client.from("admin_audit_events").insert({
    admin_id: admin.id,
    action: "vendor.created",
    entity_type: "vendor",
    entity_id: data.id,
    reason: "Created through operations console",
    correlation_id: crypto.randomUUID(),
  });
  revalidatePath("/vendors");
}
export async function updateVendor(formData: FormData) {
  const admin = await requireAdmin();
  const vendorId = z.string().uuid().parse(formData.get("vendorId"));
  const input = VendorInput.parse(Object.fromEntries(formData));
  const client = createAdminClient();
  const { error } = await client
    .from("vendors")
    .update({
      name: input.name,
      category: input.category,
      area: input.area,
      description: input.description,
      capacity_min: input.capacityMin,
      capacity_max: input.capacityMax,
      price_from_kobo: input.priceNaira * 100,
      published: false,
    })
    .eq("id", vendorId);
  if (error) throw new Error("Could not update vendor");
  await client.from("admin_audit_events").insert({
    admin_id: admin.id,
    action: "vendor.updated",
    entity_type: "vendor",
    entity_id: vendorId,
    reason: "Listing changed and automatically unpublished for review",
    correlation_id: crypto.randomUUID(),
  });
  revalidatePath("/vendors");
}
export async function createPackage(formData: FormData) {
  const admin = await requireAdmin();
  const input = PackageInput.parse(Object.fromEntries(formData));
  const client = createAdminClient();
  const { data, error } = await client
    .from("service_packages")
    .insert({
      vendor_id: input.vendorId,
      name: input.name,
      description: input.description,
      price_from_kobo: input.priceNaira * 100,
      guest_min: input.guestMin,
      guest_max: input.guestMax,
      active: true,
    })
    .select("id")
    .single();
  if (error) throw new Error("Could not create package");
  await client.from("admin_audit_events").insert({
    admin_id: admin.id,
    action: "package.created",
    entity_type: "service_package",
    entity_id: data.id,
    reason: "Created through operations console",
    correlation_id: crypto.randomUUID(),
  });
  revalidatePath("/vendors");
}
export async function updatePackage(formData: FormData) {
  const admin = await requireAdmin();
  const packageId = z.string().uuid().parse(formData.get("packageId"));
  const input = PackageInput.parse(Object.fromEntries(formData));
  const client = createAdminClient();
  const { error } = await client
    .from("service_packages")
    .update({
      name: input.name,
      description: input.description,
      price_from_kobo: input.priceNaira * 100,
      guest_min: input.guestMin,
      guest_max: input.guestMax,
      active: formData.get("active") === "true",
    })
    .eq("id", packageId)
    .eq("vendor_id", input.vendorId);
  if (error) throw new Error("Could not update package");
  await client.from("admin_audit_events").insert({
    admin_id: admin.id,
    action: "package.updated",
    entity_type: "service_package",
    entity_id: packageId,
    reason: "Updated through operations console",
    correlation_id: crypto.randomUUID(),
  });
  revalidatePath("/vendors");
}
export async function approveVerification(formData: FormData) {
  const admin = await requireAdmin();
  const vendorId = z.string().uuid().parse(formData.get("vendorId"));
  if (formData.get("attested") !== "yes") throw new Error("Verification attestation is required");
  const client = createAdminClient();
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 1);
  const { error } = await client.from("verification_records").insert({
    vendor_id: vendorId,
    status: "approved",
    identity_checked: true,
    contact_checked: true,
    bank_name_checked: true,
    authority_checked: true,
    portfolio_checked: true,
    references_checked: true,
    physical_site_checked: true,
    checked_by: admin.id,
    checked_at: new Date().toISOString(),
    expires_at: expires.toISOString(),
    public_note:
      "MMEMME checked identity, operating authority, references, portfolio and the physical operating site.",
  });
  if (error) throw new Error("Could not approve verification");
  await client
    .from("vendors")
    .update({ verification_status: "approved", verification_expires_at: expires.toISOString() })
    .eq("id", vendorId);
  revalidatePath("/vendors");
}
export async function setPublished(formData: FormData) {
  await requireAdmin();
  const vendorId = z.string().uuid().parse(formData.get("vendorId"));
  const published = formData.get("published") === "true";
  const { data, error } = await createAdminClient()
    .from("vendors")
    .update({ published })
    .eq("id", vendorId)
    .eq("verification_status", "approved")
    .select("id")
    .maybeSingle();
  if (error || !data) throw new Error("Only approved vendors can be published");
  revalidatePath("/vendors");
}
