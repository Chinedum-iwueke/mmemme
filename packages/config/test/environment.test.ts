import { describe, expect, it } from "vitest";
import { parseEnvironment, PublicMobileEnvironment, ServerEnvironment } from "../src/index";

const valid = {
  MMEMME_ENV: "staging",
  SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-key-at-least-20",
  PAYSTACK_SECRET_KEY: "sk_test_example",
  REQUESTS_ENABLED: "true",
  PAYMENTS_SANDBOX_ENABLED: "true",
  PAYMENTS_LIVE_ENABLED: "false",
  PAYMENTS_DEMO_MODE: "false",
};
describe("environment contract", () => {
  it("rejects demo payment in production", () =>
    expect(() =>
      parseEnvironment(
        ServerEnvironment,
        { ...valid, MMEMME_ENV: "production", PAYMENTS_DEMO_MODE: "true" },
        "server",
      ),
    ).toThrow(/PAYMENTS_DEMO_MODE/));
  it("requires live provider configuration", () =>
    expect(() =>
      parseEnvironment(
        ServerEnvironment,
        { ...valid, PAYSTACK_SECRET_KEY: undefined, PAYMENTS_LIVE_ENABLED: "true" },
        "server",
      ),
    ).toThrow(/PAYSTACK_SECRET_KEY/));
  it("requires HTTPS for production mobile-to-web handoff", () =>
    expect(() =>
      parseEnvironment(
        PublicMobileEnvironment,
        {
          EXPO_PUBLIC_MMEMME_ENV: "production",
          EXPO_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
          EXPO_PUBLIC_SUPABASE_ANON_KEY: "publishable-key-at-least-20",
          EXPO_PUBLIC_WEB_URL: "http://mmemme.com",
          EXPO_PUBLIC_REQUESTS_ENABLED: "true",
          EXPO_PUBLIC_PAYMENTS_SANDBOX_ENABLED: "false",
          EXPO_PUBLIC_PAYMENTS_LIVE_ENABLED: "false",
          EXPO_PUBLIC_DEMO_MODE: "false",
        },
        "mobile public",
      ),
    ).toThrow(/EXPO_PUBLIC_WEB_URL/));
});
