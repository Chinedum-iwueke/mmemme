import { parseEnvironment, PublicMobileEnvironment } from "@mmemme/config";

parseEnvironment(PublicMobileEnvironment, process.env, "mobile public");

export default {
  name: "MMEMME",
  slug: "mmemme",
  scheme: "mmemme",
  version: "0.1.0",
  orientation: "portrait",
  userInterfaceStyle: "light",
  plugins: [
    "expo-router",
    "expo-secure-store",
    "expo-web-browser",
    "@sentry/react-native",
    "expo-notifications",
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "ng.mmemme.app",
  },
  android: {
    package: "ng.mmemme.app",
    adaptiveIcon: {
      backgroundColor: "#FBFCF8",
    },
  },
  experiments: {
    typedRoutes: true,
  },
  extra: {
    eas: {
      projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID,
    },
  },
};
