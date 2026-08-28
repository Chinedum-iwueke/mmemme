import { z } from "npm:zod@3.25.76";
import { corsHeaders } from "./cors.ts";

export const Uuid = z.string().uuid();
export const InitializePaymentRequest = z
  .object({ bookingId: Uuid, quoteId: Uuid, channel: z.enum(["mobile", "web"]).optional() })
  .strict();
export const RefundRequest = z.object({ refundId: Uuid }).strict();
export type ErrorCode =
  | "INVALID_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "FEATURE_DISABLED"
  | "PAYMENT_GATE_CLOSED"
  | "PROVIDER_UNAVAILABLE"
  | "INTERNAL_ERROR";
const messages: Record<ErrorCode, string> = {
  INVALID_REQUEST: "Check the information and try again.",
  UNAUTHORIZED: "Sign in to continue.",
  FORBIDDEN: "You do not have permission to do that.",
  NOT_FOUND: "We could not find that record.",
  CONFLICT: "This action is no longer available. Refresh and try again.",
  FEATURE_DISABLED: "This feature is not available yet.",
  PAYMENT_GATE_CLOSED: "Payments are temporarily unavailable.",
  PROVIDER_UNAVAILABLE: "The payment provider is temporarily unavailable.",
  INTERNAL_ERROR: "We could not complete that action. Try again or contact support.",
};
export const correlationId = () => crypto.randomUUID();
export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
export function failure(code: ErrorCode, status: number, id = correlationId()) {
  return json({ ok: false, error: { code, message: messages[code], correlationId: id } }, status);
}
export function success<T>(data: T, id = correlationId(), status = 200) {
  return json({ ok: true, data, correlationId: id }, status);
}
