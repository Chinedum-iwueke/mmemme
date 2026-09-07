import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@mmemme/database";
import { AppState, Platform } from "react-native";
import { secureStorage } from "./secure-storage";
import { parseEnvironment, PublicMobileEnvironment } from "@mmemme/config";

export const mobileEnvironment = parseEnvironment(
  PublicMobileEnvironment,
  process.env,
  "mobile public",
);
export const isSupabaseConfigured = true;

export const supabase = createClient<Database>(
  mobileEnvironment.EXPO_PUBLIC_SUPABASE_URL,
  mobileEnvironment.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      storage: Platform.OS === "web" ? undefined : secureStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);

if (Platform.OS !== "web") {
  AppState.addEventListener("change", (state) => {
    if (state === "active") supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
