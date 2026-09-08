import * as Sentry from "@sentry/react-native";
Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  enabled: Boolean(process.env.EXPO_PUBLIC_SENTRY_DSN),
  release: process.env.EXPO_PUBLIC_SENTRY_RELEASE,
  sendDefaultPii: false,
  tracesSampleRate: 0.1,
});
export const captureError = (error: unknown, context: Record<string, unknown> = {}) => {
  const safeContext = Object.fromEntries(
    Object.entries(context).filter(
      ([key]) => !/email|phone|token|secret|message|payload|nin|bvn/i.test(key),
    ),
  );
  console.error(
    JSON.stringify({
      level: "error",
      at: new Date().toISOString(),
      ...safeContext,
      error: error instanceof Error ? error.message : String(error),
    }),
  );
  Sentry.captureException(error, { extra: safeContext });
};
