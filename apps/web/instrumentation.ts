import * as Sentry from "@sentry/nextjs";
import { parseEnvironment, PublicWebEnvironment } from "@mmemme/config";
export async function register() {
  parseEnvironment(PublicWebEnvironment, process.env, "public web");
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN),
    release: process.env.SENTRY_RELEASE,
    sendDefaultPii: false,
    tracesSampleRate: 0.1,
    beforeSend(event) {
      if (event.request) event.request = { method: event.request.method, url: event.request.url };
      return event;
    },
  });
}
export const onRequestError = Sentry.captureRequestError;
