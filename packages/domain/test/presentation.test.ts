import { describe, expect, it } from "vitest";
import {
  BookingStatus,
  PaymentStatus,
  PayoutStatus,
  CancellationStatus,
  RefundStatus,
  DisputeStatus,
  statusCopy,
  trustDisclosure,
  type StatusCopy,
} from "../src/index";
const domains = [
  ["booking", BookingStatus.options],
  ["payment", PaymentStatus.options],
  ["payout", PayoutStatus.options],
  ["cancellation", CancellationStatus.options],
  ["refund", RefundStatus.options],
  ["dispute", DisputeStatus.options],
] as const;
describe("customer presentation language", () => {
  it.each(domains)("covers every %s state", (domain, states) => {
    expect(Object.keys(statusCopy[domain])).toEqual(states);
    for (const state of states) {
      const copy = (statusCopy[domain] as Record<string, StatusCopy>)[state];
      expect(copy.label).not.toMatch(/_/);
      expect(copy.description.length).toBeGreaterThan(12);
    }
  });
  it("does not overclaim verification", () =>
    expect(trustDisclosure.full).toContain("not a guarantee"));
  it("matches the reviewed contract", () => expect(statusCopy).toMatchSnapshot());
});
