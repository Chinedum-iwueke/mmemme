import { type NextRequest, NextResponse } from "next/server";

type Store = "ios" | "android";

function approvedStoreUrl(store: Store) {
  const configured =
    store === "ios"
      ? process.env.NEXT_PUBLIC_IOS_APP_STORE_URL
      : process.env.NEXT_PUBLIC_GOOGLE_PLAY_STORE_URL;
  if (!configured) return null;
  try {
    const url = new URL(configured);
    const approvedHost = store === "ios" ? "apps.apple.com" : "play.google.com";
    return url.protocol === "https:" && url.hostname === approvedHost ? url : null;
  } catch {
    return null;
  }
}

export function GET(request: NextRequest) {
  const agent = request.headers.get("user-agent") ?? "";
  const store = /android/i.test(agent) ? "android" : /iPhone|iPad|iPod/i.test(agent) ? "ios" : null;
  if (store) {
    const listing = approvedStoreUrl(store);
    if (listing) return NextResponse.redirect(listing);
  }
  const fallback = `/get-the-app${store ? `?platform=${store}` : ""}`;
  return new NextResponse(null, { status: 307, headers: { location: fallback } });
}
