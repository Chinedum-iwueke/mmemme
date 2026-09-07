import * as Device from "expo-device";
import * as DocumentPicker from "expo-document-picker";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { supabase } from "./supabase";
import type { Json } from "@mmemme/database";

export async function getBookingSafety(bookingId: string) {
  const [
    { data: messages },
    { data: cancellation },
    { data: refunds },
    { data: disputes },
    { data: review },
  ] = await Promise.all([
    supabase
      .from("support_messages")
      .select("id,author_id,body,created_at")
      .eq("booking_id", bookingId)
      .order("created_at"),
    supabase.from("cancellations").select("*").eq("booking_id", bookingId).maybeSingle(),
    supabase
      .from("refunds")
      .select("*")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: false }),
    supabase
      .from("disputes")
      .select("*")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: false }),
    supabase.from("reviews").select("*").eq("booking_id", bookingId).maybeSingle(),
  ]);
  return {
    messages: messages ?? [],
    cancellation,
    refunds: refunds ?? [],
    disputes: disputes ?? [],
    review,
  };
}
export async function sendSupport(bookingId: string, userId: string, body: string) {
  const { error } = await supabase
    .from("support_messages")
    .insert({ booking_id: bookingId, author_id: userId, body: body.trim() });
  if (error) throw error;
}
export async function cancellationPreview(bookingId: string) {
  const { data, error } = await supabase.rpc("cancellation_preview", {
    p_booking_id: bookingId,
  });
  if (error) throw error;
  return data as {
    paidAmountKobo: number;
    refundableAmountKobo: number;
    retainedAmountKobo: number;
    daysBeforeEvent: number;
    refundPercent: number;
    policyVersion: string;
  };
}
export async function requestCancellation(bookingId: string, reason: string) {
  const { error } = await supabase.rpc("request_cancellation", {
    p_booking_id: bookingId,
    p_reason: reason,
  });
  if (error) throw error;
}
export async function openDispute(bookingId: string, reason: string) {
  const { data, error } = await supabase.rpc("open_booking_dispute", {
    p_booking_id: bookingId,
    p_reason: reason,
  });
  if (error) throw error;
  return data as { id: string };
}
export async function uploadDisputeEvidence(disputeId: string, userId: string) {
  const result = await DocumentPicker.getDocumentAsync({
    type: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
    copyToCacheDirectory: true,
  });
  if (result.canceled) return false;
  const file = result.assets[0];
  if ((file.size ?? 0) > 10 * 1024 * 1024)
    throw new Error("Evidence files must be 10 MB or smaller.");
  const accepted = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  if (!file.mimeType || !accepted.includes(file.mimeType))
    throw new Error("Upload a JPEG, PNG, WebP or PDF file.");
  const path = `${userId}/${disputeId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
  const bytes = await (await fetch(file.uri)).arrayBuffer();
  const { error } = await supabase.storage.from("dispute-evidence").upload(path, bytes, {
    contentType: file.mimeType ?? "application/octet-stream",
  });
  if (error) throw error;
  const { error: rowError } = await supabase.from("dispute_evidence").insert({
    dispute_id: disputeId,
    uploaded_by: userId,
    storage_path: path,
    media_type: file.mimeType ?? "application/octet-stream",
    description: file.name,
  });
  if (rowError) throw rowError;
  return true;
}
export async function confirmFulfillment(bookingId: string) {
  const { error } = await supabase.rpc("confirm_fulfillment", {
    p_booking_id: bookingId,
  });
  if (error) throw error;
}
export async function submitReview(
  bookingId: string,
  userId: string,
  vendorId: string,
  rating: number,
  body: string,
) {
  const { error } = await supabase.from("reviews").insert({
    booking_id: bookingId,
    customer_id: userId,
    vendor_id: vendorId,
    rating,
    body: body.trim(),
  });
  if (error) throw error;
}
export async function saveNotificationPreferences(
  userId: string,
  input: { push: boolean; email: boolean; reminders: boolean },
) {
  const { error } = await supabase.from("notification_preferences").upsert({
    customer_id: userId,
    push_enabled: input.push,
    email_enabled: input.email,
    reminders_enabled: input.reminders,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
  if (input.push && Device.isDevice) {
    const permission = await Notifications.requestPermissionsAsync();
    if (permission.status === "granted") {
      const projectId =
        Constants.easConfig?.projectId ?? Constants.expoConfig?.extra?.eas?.projectId;
      if (projectId) {
        const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        await supabase.from("push_tokens").upsert(
          {
            customer_id: userId,
            token,
            platform: Platform.OS,
            active: true,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "token" },
        );
      }
    }
  }
}
export async function track(
  name: string,
  bookingId?: string,
  properties: Record<string, unknown> = {},
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user)
    await supabase.from("product_events").insert({
      customer_id: user.id,
      booking_id: bookingId,
      name,
      properties: properties as Json,
    });
}
