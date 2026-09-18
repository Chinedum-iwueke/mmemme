import * as WebBrowser from "expo-web-browser";
import { mobileEnvironment } from "./supabase";

export type VendorWebDestination = "/vendor/apply" | "/vendor/workspace";

export function vendorWebUrl(destination: VendorWebDestination) {
  return new URL(
    destination,
    `${mobileEnvironment.EXPO_PUBLIC_WEB_URL.replace(/\/$/, "")}/`,
  ).toString();
}

export async function openVendorWeb(destination: VendorWebDestination) {
  return WebBrowser.openBrowserAsync(vendorWebUrl(destination), {
    controlsColor: "#294A41",
    presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
  });
}
