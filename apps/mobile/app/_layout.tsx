import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { colors } from "../src/components/ui";

export default function RootLayout() {
  return <><StatusBar style="dark" /><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.ivory } }} /></>;
}
