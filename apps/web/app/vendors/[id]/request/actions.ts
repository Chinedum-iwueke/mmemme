"use server";
import { redirect } from "next/navigation";
import { requireCustomer } from "../../../../lib/supabase/server";
export async function submitBookingRequest(formData: FormData) {
  const vendorId = String(formData.get("vendorId") || "");
  const packageId = String(formData.get("packageId") || "") || null;
  const briefId = String(formData.get("briefId") || "");
  const requirements = String(formData.get("requirements") || "").trim();
  const guestCount = Number(formData.get("guestCount"));
  const requestId = String(formData.get("clientRequestId") || "");
  if (!formData.get("availabilityAcknowledged")) redirect(`/vendors/${vendorId}/request?error=ack`);
  const { client } = await requireCustomer(`/vendors/${vendorId}/request`);
  const { data, error } = await client.rpc("submit_booking_request", {
    p_vendor_id: vendorId,
    p_package_id: packageId as string,
    p_wedding_brief_id: briefId,
    p_requirements: requirements,
    p_guest_count: guestCount,
    p_client_request_id: requestId,
  });
  if (error) redirect(`/vendors/${vendorId}/request?error=${encodeURIComponent(error.message)}`);
  redirect(`/bookings/${data.id}?created=1`);
}
