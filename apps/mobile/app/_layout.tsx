import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "../src/lib/observability";
import { colors } from "../src/components/ui";
import { AuthProvider } from "../src/lib/auth";
import { AppLifecycle } from "../src/lib/lifecycle";

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppLifecycle>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.ivory },
            animation: "slide_from_right",
            gestureEnabled: true,
          }}
        />
      </AppLifecycle>
    </AuthProvider>
  );
}
