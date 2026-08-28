export type Platform = "web" | "mobile";
export const bookingRoute = (platform: Platform, bookingId: string, section?: "support") =>
  platform === "web"
    ? `/bookings/${bookingId}${section ? `#${section}` : ""}`
    : `mmemme://booking/${section === "support" ? "manage/" : ""}${bookingId}`;
export type DraftChoice = "device" | "account";
export function resolveDraft<T>(device: T, account: T, choice: DraftChoice) {
  return choice === "device" ? device : account;
}
export function mergeShortlist(device: string[], account: string[]) {
  return [...new Set([...device, ...account])];
}
