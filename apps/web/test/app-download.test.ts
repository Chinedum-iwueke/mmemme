import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../app/get-app/route";

const originalIos = process.env.NEXT_PUBLIC_IOS_APP_STORE_URL;
const originalAndroid = process.env.NEXT_PUBLIC_GOOGLE_PLAY_STORE_URL;

afterEach(() => {
  process.env.NEXT_PUBLIC_IOS_APP_STORE_URL = originalIos;
  process.env.NEXT_PUBLIC_GOOGLE_PLAY_STORE_URL = originalAndroid;
});

describe("smart app download link", () => {
  it("sends an iPhone to the approved App Store listing", () => {
    process.env.NEXT_PUBLIC_IOS_APP_STORE_URL = "https://apps.apple.com/ng/app/mmemme/id123456";
    const response = GET(
      new NextRequest("https://mmemme.test/get-app", {
        headers: { "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)" },
      }),
    );
    expect(response.headers.get("location")).toBe("https://apps.apple.com/ng/app/mmemme/id123456");
  });

  it("sends Android to Google Play", () => {
    process.env.NEXT_PUBLIC_GOOGLE_PLAY_STORE_URL =
      "https://play.google.com/store/apps/details?id=ng.mmemme.app";
    const response = GET(
      new NextRequest("https://mmemme.test/get-app", {
        headers: { "user-agent": "Mozilla/5.0 (Linux; Android 15)" },
      }),
    );
    expect(response.headers.get("location")).toBe(
      "https://play.google.com/store/apps/details?id=ng.mmemme.app",
    );
  });

  it("uses the safe pre-launch page when a listing is unavailable", () => {
    delete process.env.NEXT_PUBLIC_IOS_APP_STORE_URL;
    const response = GET(
      new NextRequest("https://mmemme.test/get-app", {
        headers: { "user-agent": "Mozilla/5.0 (iPhone)" },
      }),
    );
    expect(response.headers.get("location")).toBe("/get-the-app?platform=ios");
  });

  it("rejects an unapproved redirect host", () => {
    process.env.NEXT_PUBLIC_GOOGLE_PLAY_STORE_URL = "https://malicious.test/mmemme";
    const response = GET(
      new NextRequest("https://mmemme.test/get-app", {
        headers: { "user-agent": "Mozilla/5.0 (Linux; Android 15)" },
      }),
    );
    expect(response.headers.get("location")).toBe("/get-the-app?platform=android");
  });
});
