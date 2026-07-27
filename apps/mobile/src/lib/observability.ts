import * as Sentry from "@sentry/react-native";
Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  enabled: Boolean(process.env.EXPO_PUBLIC_SENTRY_DSN),
  sendDefaultPii: false,
  tracesSampleRate: 0.1,
});
export const captureError = (
  error: unknown,
  context: Record<string, unknown> = {},
) => {
  console.error(
    JSON.stringify({
      level: "error",
      at: new Date().toISOString(),
      ...context,
      error: error instanceof Error ? error.message : String(error),
    }),
  );
  Sentry.captureException(error, { extra: context });
};
