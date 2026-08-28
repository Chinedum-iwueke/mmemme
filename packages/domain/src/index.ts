import { z } from "zod";

export const VendorCategory = z.enum(["venue", "caterer"]);
export type VendorCategory = z.infer<typeof VendorCategory>;

export const WeddingBrief = z
  .object({
    weddingDate: z.string().date(),
    area: z.string().trim().min(2).max(80),
    guestCount: z.number().int().min(10).max(5000),
    budgetMinKobo: z.number().int().nonnegative(),
    budgetMaxKobo: z.number().int().positive(),
    priorities: z.array(VendorCategory).min(1).max(2),
  })
  .refine((value) => value.budgetMaxKobo >= value.budgetMinKobo, {
    message: "Maximum budget must be greater than or equal to minimum budget",
    path: ["budgetMaxKobo"],
  });
export type WeddingBrief = z.infer<typeof WeddingBrief>;

export const BookingStatus = z.enum([
  "requested",
  "operations_review",
  "quote_ready",
  "accepted_awaiting_payment",
  "confirmed",
  "service_due",
  "fulfilled",
  "completed",
  "declined",
  "expired",
  "cancelled",
  "disputed",
]);
export type BookingStatus = z.infer<typeof BookingStatus>;

export const PaymentStatus = z.enum([
  "initiated",
  "pending",
  "succeeded",
  "failed",
  "partially_refunded",
  "refunded",
  "charged_back",
]);
export type PaymentStatus = z.infer<typeof PaymentStatus>;

export const PayoutStatus = z.enum([
  "held",
  "eligible",
  "processing",
  "paid",
  "failed",
  "reversed",
]);
export type PayoutStatus = z.infer<typeof PayoutStatus>;

const bookingTransitions: Record<BookingStatus, readonly BookingStatus[]> = {
  requested: ["operations_review", "declined", "cancelled"],
  operations_review: ["quote_ready", "declined", "cancelled"],
  quote_ready: ["accepted_awaiting_payment", "expired", "cancelled"],
  accepted_awaiting_payment: ["confirmed", "expired", "cancelled"],
  confirmed: ["service_due", "cancelled", "disputed"],
  service_due: ["fulfilled", "cancelled", "disputed"],
  fulfilled: ["completed", "disputed"],
  disputed: ["fulfilled", "completed", "cancelled"],
  completed: [],
  declined: [],
  expired: [],
  cancelled: [],
};

const paymentTransitions: Record<PaymentStatus, readonly PaymentStatus[]> = {
  initiated: ["pending", "succeeded", "failed"],
  pending: ["succeeded", "failed"],
  succeeded: ["partially_refunded", "refunded", "charged_back"],
  partially_refunded: ["refunded", "charged_back"],
  failed: [],
  refunded: [],
  charged_back: [],
};

const payoutTransitions: Record<PayoutStatus, readonly PayoutStatus[]> = {
  held: ["eligible", "reversed"],
  eligible: ["processing", "reversed"],
  processing: ["paid", "failed"],
  failed: ["processing", "reversed"],
  paid: ["reversed"],
  reversed: [],
};

export const canTransitionBooking = (from: BookingStatus, to: BookingStatus) =>
  bookingTransitions[from].includes(to);
export const canTransitionPayment = (from: PaymentStatus, to: PaymentStatus) =>
  paymentTransitions[from].includes(to);
export const canTransitionPayout = (from: PayoutStatus, to: PayoutStatus) =>
  payoutTransitions[from].includes(to);

export const BookingRequestInput = z.object({
  vendorId: z.string().uuid(),
  packageId: z.string().uuid().nullable(),
  weddingBriefId: z.string().uuid(),
  clientRequestId: z.string().uuid(),
  guestCount: z.number().int().min(10).max(5000),
  requirements: z.string().trim().min(20).max(2000),
});

export const QuoteInput = z
  .object({
    bookingId: z.string().uuid(),
    totalAmountKobo: z.number().int().positive(),
    depositAmountKobo: z.number().int().positive(),
    expiresAt: z.string().datetime(),
    termsVersion: z.string().min(1),
    cancellationSummary: z.string().trim().min(20).max(1500),
    inclusions: z.array(z.string().trim().min(1)),
    exclusions: z.array(z.string().trim().min(1)),
    paymentSchedule: z.string().trim().min(5).max(500),
    availabilityConfirmed: z.literal(true),
  })
  .refine((value) => value.depositAmountKobo <= value.totalAmountKobo, {
    message: "Deposit cannot exceed quote total",
    path: ["depositAmountKobo"],
  });

export const InitializePaymentInput = z.object({
  bookingId: z.string().uuid(),
  quoteId: z.string().uuid(),
});

export const RefundInput = z.object({ refundId: z.string().uuid() });
export const ApiErrorCode = z.enum([
  "INVALID_REQUEST",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
  "CONFLICT",
  "FEATURE_DISABLED",
  "PAYMENT_GATE_CLOSED",
  "PROVIDER_UNAVAILABLE",
  "INTERNAL_ERROR",
]);
export type ApiErrorCode = z.infer<typeof ApiErrorCode>;
export const ApiError = z.object({
  ok: z.literal(false),
  error: z.object({ code: ApiErrorCode, message: z.string(), correlationId: z.string().uuid() }),
});
export const InitializePaymentResponse = z.object({
  ok: z.literal(true),
  data: z.object({
    authorizationUrl: z.string().url(),
    reference: z.string().min(1),
    reused: z.boolean().optional(),
  }),
  correlationId: z.string().uuid(),
});
export type InitializePaymentResponse = z.infer<typeof InitializePaymentResponse>;

export function safeApiMessage(code: ApiErrorCode) {
  const messages: Record<ApiErrorCode, string> = {
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
  return messages[code];
}
export * from "./presentation";
