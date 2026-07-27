import * as Sentry from "@sentry/nextjs";
export async function register() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    enabled: Boolean(process.env.SENTRY_DSN),
    sendDefaultPii: false,
    tracesSampleRate: 0.1,
  });
}
export const onRequestError = Sentry.captureRequestError;
