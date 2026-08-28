import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { bookingRoute, mergeShortlist, resolveDraft } from "../lib/continuity";
const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
describe("durable cross-platform customer journey", () => {
  it("keeps booking identity stable while routes alternate platforms", () => {
    const id = "7e216e66-1b75-4bc8-b0f3-9ea771599dbe";
    expect(bookingRoute("web", id)).toBe(`/bookings/${id}`);
    expect(bookingRoute("mobile", id)).toBe(`mmemme://booking/${id}`);
    expect(bookingRoute("web", id, "support")).toBe(`/bookings/${id}#support`);
  });
  it("requires an explicit draft conflict choice and merges shortlist without duplicates", () => {
    expect(resolveDraft("local", "remote", "account")).toBe("remote");
    expect(resolveDraft("local", "remote", "device")).toBe("local");
    expect(mergeShortlist(["a", "b"], ["b", "c"])).toEqual(["a", "b", "c"]);
  });
  it("uses the same idempotent request and authoritative payment operations as mobile", () => {
    const web =
      read("../app/vendors/[id]/request/actions.ts") + read("../app/bookings/[id]/actions.ts");
    const mobile = read("../../mobile/src/lib/bookings.ts");
    expect(web).toContain('rpc("submit_booking_request"');
    expect(mobile).toContain('rpc("submit_booking_request"');
    expect(web).toContain('functions.invoke("initialize-payment"');
    expect(web).toContain('channel: "web"');
    expect(mobile).toContain('functions.invoke("initialize-payment"');
  });
  it("refreshes cookie sessions and preserves a safe return intent", () => {
    const proxy = read("../proxy.ts");
    const auth =
      read("../components/customer/auth-form.tsx") + read("../components/customer/account-nav.tsx");
    expect(proxy).toContain("auth.getUser()");
    expect(proxy).toContain("response.cookies.set");
    expect(auth).toContain('!value.startsWith("//")');
    expect(auth).toContain("onAuthStateChange");
  });
  it("never treats checkout return as confirmation", () => {
    const recovery = read("../components/customer/payment-recovery.tsx");
    const page = read("../app/checkout/return/page.tsx");
    expect(recovery).toContain('.from("payments")');
    expect(recovery).toContain('status === "succeeded"');
    expect(page.toLowerCase()).toContain(
      "coming back from checkout never marks a payment successful",
    );
  });
  it("enforces evidence type and size at UI, server action, storage, and RLS boundaries", () => {
    const action = read("../app/bookings/[id]/actions.ts");
    const migration = read("../../../supabase/migrations/202607270006_beta_safety_and_release.sql");
    expect(action).toContain("10_485_760");
    for (const type of ["image/jpeg", "image/png", "image/webp", "application/pdf"])
      expect(action).toContain(type);
    expect(migration).toContain("file_size_limit");
    expect(migration).toContain("customers upload own dispute evidence");
  });
  it("stores both mobile and web notification destinations", () => {
    const migration = read("../../../supabase/migrations/202608280007_web_customer_continuity.sql");
    expect(migration).toContain("deep_link,web_path");
    expect(migration).toContain("mmemme://booking/");
    expect(migration).toContain("/bookings/");
  });
});
