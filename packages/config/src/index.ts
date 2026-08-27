import { z } from "zod";

export const RuntimeEnvironment = z.enum(["local", "preview", "staging", "production", "test"]);
export type RuntimeEnvironment = z.infer<typeof RuntimeEnvironment>;

const booleanFlag = z.enum(["true", "false"]).transform((value) => value === "true");
const url = z.string().url();

export const PublicWebEnvironment = z.object({
  NEXT_PUBLIC_MMEMME_ENV: RuntimeEnvironment,
  NEXT_PUBLIC_SUPABASE_URL: url,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
  NEXT_PUBLIC_REQUESTS_ENABLED: booleanFlag,
});

export const PublicMobileEnvironment = z.object({
  EXPO_PUBLIC_MMEMME_ENV: RuntimeEnvironment,
  EXPO_PUBLIC_SUPABASE_URL: url,
  EXPO_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
  EXPO_PUBLIC_REQUESTS_ENABLED: booleanFlag,
  EXPO_PUBLIC_PAYMENTS_SANDBOX_ENABLED: booleanFlag,
  EXPO_PUBLIC_PAYMENTS_LIVE_ENABLED: booleanFlag,
  EXPO_PUBLIC_DEMO_MODE: booleanFlag,
});

export const ServerEnvironment = z
  .object({
    MMEMME_ENV: RuntimeEnvironment,
    SUPABASE_URL: url,
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
    PAYSTACK_SECRET_KEY: z.string().min(10).optional(),
    REQUESTS_ENABLED: booleanFlag,
    PAYMENTS_SANDBOX_ENABLED: booleanFlag,
    PAYMENTS_LIVE_ENABLED: booleanFlag,
    PAYMENTS_DEMO_MODE: booleanFlag,
  })
  .superRefine((env, context) => {
    if (env.MMEMME_ENV === "production" && env.PAYMENTS_DEMO_MODE)
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["PAYMENTS_DEMO_MODE"],
        message: "Demo payments are forbidden in production",
      });
    if (env.MMEMME_ENV === "production" && env.PAYMENTS_SANDBOX_ENABLED)
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["PAYMENTS_SANDBOX_ENABLED"],
        message: "Sandbox payments are forbidden in production",
      });
    if (env.PAYMENTS_LIVE_ENABLED && !env.PAYSTACK_SECRET_KEY)
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["PAYSTACK_SECRET_KEY"],
        message: "Live payments require a Paystack secret",
      });
  });

export type FeatureFlags = Readonly<{
  requests: boolean;
  sandboxPayments: boolean;
  livePayments: boolean;
  demoPayments: boolean;
}>;
export function featureFlags(env: z.infer<typeof ServerEnvironment>): FeatureFlags {
  return Object.freeze({
    requests: env.REQUESTS_ENABLED,
    sandboxPayments: env.PAYMENTS_SANDBOX_ENABLED,
    livePayments: env.PAYMENTS_LIVE_ENABLED,
    demoPayments: env.PAYMENTS_DEMO_MODE,
  });
}

export function parseEnvironment<TSchema extends z.ZodTypeAny>(
  schema: TSchema,
  values: unknown,
  scope: string,
): z.output<TSchema> {
  const result = schema.safeParse(values);
  if (!result.success) {
    const fields = result.error.issues
      .map((issue) => issue.path.join(".") || "environment")
      .join(", ");
    throw new Error(`Invalid ${scope} configuration: ${fields}`);
  }
  return result.data;
}
