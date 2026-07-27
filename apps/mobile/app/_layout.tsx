import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "../src/lib/observability";
import { colors } from "../src/components/ui";
import { AuthProvider } from "../src/lib/auth";

export default function RootLayout() {
  return <AuthProvider><StatusBar style="dark" /><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.ivory } }} /></AuthProvider>;
}
