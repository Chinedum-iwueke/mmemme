import { parseEnvironment, PublicMobileEnvironment } from "@mmemme/config";

parseEnvironment(PublicMobileEnvironment, process.env, "mobile public");

export default {
  name: "MMEMME",
  slug: "mmemme",
  scheme: "mmemme",
  version: "0.1.0",
  orientation: "portrait",
  userInterfaceStyle: "light",
  splash: {
    image: "./assets/brand/mmemme-stacked-green.png",
    resizeMode: "contain",
    backgroundColor: "#fbfcf8",
  },
  runtimeVersion: { policy: "appVersion" },
  updates: { checkAutomatically: "ON_LOAD", fallbackToCacheTimeout: 0 },
  plugins: [
    "expo-router",
    "expo-secure-store",
    "expo-web-browser",
    "@sentry/react-native",
    "expo-notifications",
    "expo-updates",
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "ng.mmemme.app",
    associatedDomains: ["applinks:mmemme.com"],
  },
  android: {
    package: "ng.mmemme.app",
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [{ scheme: "https", host: "mmemme.com", pathPrefix: "/booking" }],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
    adaptiveIcon: {
      // Mirrors tokens.neutral[25]; Expo config cannot import the JSON-backed token package.
      backgroundColor: "#fbfcf8",
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
