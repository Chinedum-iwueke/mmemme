import { describe, expect, it } from "vitest";
import { canTransitionBooking, canTransitionPayment, canTransitionPayout, WeddingBrief } from "../src/index";

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
