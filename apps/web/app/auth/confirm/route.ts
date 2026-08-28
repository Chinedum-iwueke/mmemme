import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { serverClient } from "../../../lib/supabase/server";
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const next = url.searchParams.get("next");
  if (tokenHash && type) {
    const { error } = await (await serverClient()).auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error)
      return NextResponse.redirect(new URL(next?.startsWith("/") ? next : "/bookings", url.origin));
  }
  return NextResponse.redirect(new URL("/login?error=expired", url.origin));
}
