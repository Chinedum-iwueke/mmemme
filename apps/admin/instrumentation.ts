import * as Sentry from "@sentry/nextjs";
import {parseEnvironment,PublicWebEnvironment,ServerEnvironment} from "@mmemme/config";
export async function register() {
  parseEnvironment(ServerEnvironment,process.env,"operations server");
  parseEnvironment(PublicWebEnvironment,process.env,"operations public");
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    enabled: Boolean(process.env.SENTRY_DSN),
    sendDefaultPii: false,
    tracesSampleRate: 0.1,
  });
}
export const onRequestError = Sentry.captureRequestError;
