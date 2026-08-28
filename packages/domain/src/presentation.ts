import { z } from "zod";
import { BookingStatus, PaymentStatus, PayoutStatus } from "./index";
export type StatusCopy = {
  label: string;
  description: string;
  tone: "neutral" | "info" | "success" | "warning" | "error";
};
export const CancellationStatus = z.enum(["requested", "approved", "rejected"]);
export type CancellationStatus = z.infer<typeof CancellationStatus>;
export const RefundStatus = z.enum([
  "awaiting_first_approval",
  "awaiting_second_approval",
  "approved",
  "processing",
  "succeeded",
  "failed",
]);
export type RefundStatus = z.infer<typeof RefundStatus>;
export const DisputeStatus = z.enum([
  "open",
  "investigating",
  "resolved_customer",
  "resolved_vendor",
  "closed",
]);
export type DisputeStatus = z.infer<typeof DisputeStatus>;
const booking: Record<z.infer<typeof BookingStatus>, StatusCopy> = {
  requested: {
    label: "Request sent",
    description: "MMEMME is reviewing your details.",
    tone: "info",
  },
  operations_review: {
    label: "Checking with the vendor",
    description: "We have not confirmed availability yet.",
    tone: "info",
  },
  quote_ready: {
    label: "Quote ready",
    description: "Review the complete terms before it expires.",
    tone: "success",
  },
  accepted_awaiting_payment: {
    label: "Waiting for payment",
    description: "Your booking is not confirmed until payment succeeds.",
    tone: "warning",
  },
  confirmed: {
    label: "Booking confirmed",
    description: "Your receipt and next steps are ready.",
    tone: "success",
  },
  service_due: {
    label: "Event approaching",
    description: "Review the confirmed details and contact support if anything has changed.",
    tone: "info",
  },
  fulfilled: {
    label: "Service delivered",
    description: "Confirm fulfillment when you are ready.",
    tone: "success",
  },
  completed: {
    label: "Booking completed",
    description: "You can now leave a verified review.",
    tone: "success",
  },
  declined: {
    label: "Request declined",
    description: "This vendor could not accept the request. No payment was taken.",
    tone: "error",
  },
  expired: {
    label: "Quote expired",
    description: "Ask MMEMME for updated availability and terms.",
    tone: "warning",
  },
  cancelled: {
    label: "Booking cancelled",
    description: "Review the cancellation record for any refund details.",
    tone: "neutral",
  },
  disputed: {
    label: "Support case open",
    description: "MMEMME is reviewing the issue with you.",
    tone: "warning",
  },
};
const payment: Record<z.infer<typeof PaymentStatus>, StatusCopy> = {
  initiated: {
    label: "Payment started",
    description: "Complete checkout with Paystack.",
    tone: "info",
  },
  pending: {
    label: "Confirming payment",
    description: "We are waiting for verified confirmation. Do not pay again.",
    tone: "warning",
  },
  succeeded: {
    label: "Payment received",
    description: "Your verified receipt is available.",
    tone: "success",
  },
  failed: {
    label: "Payment not completed",
    description: "No booking confirmation was created from this attempt.",
    tone: "error",
  },
  partially_refunded: {
    label: "Partially refunded",
    description: "Part of this payment has been returned.",
    tone: "info",
  },
  refunded: {
    label: "Refunded",
    description: "The approved amount has been returned through the payment provider.",
    tone: "success",
  },
  charged_back: {
    label: "Payment reversed",
    description: "The payment provider reversed this transaction. Contact MMEMME support.",
    tone: "error",
  },
};
const payout: Record<z.infer<typeof PayoutStatus>, StatusCopy> = {
  held: {
    label: "Payout held",
    description: "Funds are not yet eligible for vendor payout.",
    tone: "neutral",
  },
  eligible: {
    label: "Payout eligible",
    description: "Required fulfillment checks have passed.",
    tone: "info",
  },
  processing: {
    label: "Payout processing",
    description: "The provider is processing this payout.",
    tone: "info",
  },
  paid: { label: "Vendor paid", description: "The payout was recorded as paid.", tone: "success" },
  failed: {
    label: "Payout failed",
    description: "Operations must review and retry safely.",
    tone: "error",
  },
  reversed: {
    label: "Payout reversed",
    description: "The provider reversed this payout.",
    tone: "error",
  },
};
const cancellation: Record<CancellationStatus, StatusCopy> = {
  requested: {
    label: "Cancellation requested",
    description: "MMEMME is reviewing the applicable terms.",
    tone: "warning",
  },
  approved: {
    label: "Cancellation approved",
    description: "Review the confirmed refund or retained amount.",
    tone: "success",
  },
  rejected: {
    label: "Cancellation not approved",
    description: "Open the record for the reason and support options.",
    tone: "error",
  },
};
const refund: Record<RefundStatus, StatusCopy> = {
  awaiting_first_approval: {
    label: "Refund awaiting review",
    description: "An authorized operator must review this refund.",
    tone: "warning",
  },
  awaiting_second_approval: {
    label: "Refund awaiting final review",
    description: "A second authorized operator must independently approve it.",
    tone: "warning",
  },
  approved: {
    label: "Refund approved",
    description: "MMEMME will submit the approved amount to the provider.",
    tone: "info",
  },
  processing: {
    label: "Refund processing",
    description: "The payment provider is processing the refund.",
    tone: "info",
  },
  succeeded: {
    label: "Refund completed",
    description: "The provider confirmed the refund.",
    tone: "success",
  },
  failed: {
    label: "Refund needs attention",
    description: "MMEMME operations is reviewing the failed attempt.",
    tone: "error",
  },
};
const dispute: Record<DisputeStatus, StatusCopy> = {
  open: {
    label: "Support case open",
    description: "MMEMME has received the issue.",
    tone: "warning",
  },
  investigating: {
    label: "Review in progress",
    description: "We are reviewing the booking and evidence.",
    tone: "info",
  },
  resolved_customer: {
    label: "Resolved for customer",
    description: "Open the resolution to review the customer outcome.",
    tone: "success",
  },
  resolved_vendor: {
    label: "Resolved for vendor",
    description: "Open the resolution to review the vendor outcome.",
    tone: "neutral",
  },
  closed: { label: "Case closed", description: "This support case is complete.", tone: "neutral" },
};
export const statusCopy = { booking, payment, payout, cancellation, refund, dispute } as const;
export type StatusDomain = keyof typeof statusCopy;
export function presentStatus<D extends StatusDomain>(
  domain: D,
  status: keyof (typeof statusCopy)[D],
): StatusCopy {
  return statusCopy[domain][status] as StatusCopy;
}
export const trustDisclosure = {
  compact: "MMEMME Verified",
  full: "Verification records checks completed by MMEMME. It is not a guarantee of service quality or fulfillment.",
  availability: "MMEMME confirms your date with the vendor before issuing a payment-ready quote.",
} as const;
export const validationCopy = {
  required: "This field is required.",
  invalidPhone: "Enter a valid Nigerian mobile number.",
  invalidEmail: "Enter a valid email address.",
  invalidDate: "Choose a valid future date.",
  network: "We couldn't submit this yet. Your details are saved.",
  paymentUnknown: "We are still confirming this payment. Do not pay again.",
} as const;
export const actionCopy = {
  requestVenue: "Request this venue",
  requestCaterer: "Request this caterer",
  acceptQuote: "Accept quote",
  openCheckout: "Continue to Paystack",
  contactSupport: "Contact MMEMME support",
} as const;
