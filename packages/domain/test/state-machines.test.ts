import { describe, expect, it } from "vitest";
import { ApiError, BookingRequestInput, InitializePaymentInput, QuoteInput, canTransitionBooking, canTransitionPayment, canTransitionPayout, safeApiMessage, WeddingBrief } from "../src/index";

describe("domain state machines", () => {
  it("allows the paid booking path and blocks impossible jumps", () => {
    expect(canTransitionBooking("quote_ready", "accepted_awaiting_payment")).toBe(true);
    expect(canTransitionBooking("requested", "confirmed")).toBe(false);
    expect(canTransitionBooking("completed", "requested")).toBe(false);
  });

  it("allows webhook completion once and refund progression", () => {
    expect(canTransitionPayment("pending", "succeeded")).toBe(true);
    expect(canTransitionPayment("succeeded", "refunded")).toBe(true);
    expect(canTransitionPayment("refunded", "succeeded")).toBe(false);
  });

  it("requires payout eligibility before processing", () => {
    expect(canTransitionPayout("held", "processing")).toBe(false);
    expect(canTransitionPayout("eligible", "processing")).toBe(true);
  });
});

describe("wedding brief", () => {
  it("rejects inverted budgets", () => {
    expect(WeddingBrief.safeParse({
      weddingDate: "2027-02-06", area: "Lekki", guestCount: 250,
      budgetMinKobo: 2_000_000_00, budgetMaxKobo: 1_000_000_00,
      priorities: ["venue"],
    }).success).toBe(false);
  });
});

describe("transaction input boundaries", () => {
  it("rejects malformed payment input and exposes a stable safe error contract",()=>{
    expect(InitializePaymentInput.safeParse({bookingId:"not-a-uuid",quoteId:"also-bad"}).success).toBe(false);
    expect(ApiError.safeParse({ok:false,error:{code:"INVALID_REQUEST",message:safeApiMessage("INVALID_REQUEST"),correlationId:"30000000-0000-4000-8000-000000000001"}}).success).toBe(true);
  });
  it("requires a stable idempotency key and meaningful request", () => {
    expect(BookingRequestInput.safeParse({vendorId:"10000000-0000-4000-8000-000000000001",packageId:null,weddingBriefId:"20000000-0000-4000-8000-000000000001",clientRequestId:"30000000-0000-4000-8000-000000000001",guestCount:150,requirements:"Accessible arrival and backup power are required."}).success).toBe(true);
    expect(BookingRequestInput.safeParse({vendorId:"10000000-0000-4000-8000-000000000001",packageId:null,weddingBriefId:"20000000-0000-4000-8000-000000000001",clientRequestId:"bad",guestCount:150,requirements:"Too short"}).success).toBe(false);
  });
  it("rejects an unconfirmed or oversized deposit quote", () => {
    const quote={bookingId:"10000000-0000-4000-8000-000000000001",totalAmountKobo:10000,depositAmountKobo:12000,expiresAt:"2027-01-01T00:00:00.000Z",termsVersion:"v1",cancellationSummary:"Cancellation consequences are shown before acceptance.",inclusions:["Hall"],exclusions:["Decor"],paymentSchedule:"Deposit now",availabilityConfirmed:true as const};
    expect(QuoteInput.safeParse(quote).success).toBe(false);
    expect(QuoteInput.safeParse({...quote,depositAmountKobo:5000,availabilityConfirmed:false}).success).toBe(false);
  });
});
