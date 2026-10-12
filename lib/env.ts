import "server-only";

import { z } from "zod";

const serverEnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  SMTP_HOST: z.string().min(1).optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  SMTP_USER: z.string().min(1).optional(),
  SMTP_PASSWORD: z.string().min(1).optional(),
  SMTP_FROM: z.string().min(1).default("SaadAgent <no-reply@saadagent.dev>"),
  APP_URL: z.url().default("http://localhost:3000"),
  BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
  NEXT_PUBLIC_APP_URL: z.url().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_AUTHORIZE_URL: z.url().optional(),
  GOOGLE_TOKEN_URL: z.url().optional(),
  GOOGLE_USERINFO_URL: z.url().optional(),
  FACEBOOK_CLIENT_ID: z.string().optional(),
  FACEBOOK_CLIENT_SECRET: z.string().optional(),
  FACEBOOK_AUTHORIZE_URL: z.url().optional(),
  FACEBOOK_TOKEN_URL: z.url().optional(),
  FACEBOOK_USERINFO_URL: z.url().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GITHUB_AUTHORIZE_URL: z.url().optional(),
  GITHUB_TOKEN_URL: z.url().optional(),
  GITHUB_USERINFO_URL: z.url().optional(),
  GITHUB_USER_EMAILS_URL: z.url().optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema> & {
  AUTH_SECRET: string;
  isProduction: boolean;
  isMailTransportConfigured: boolean;
};

const DEVELOPMENT_FALLBACK_SECRET =
  "saadagent-development-only-secret-do-not-use-in-production";

let warnedAboutFallbackSecret = false;

export function getServerEnv(): ServerEnv {
  const result = serverEnvSchema.safeParse(process.env);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `${issue.path.join(".") || "env"}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid server environment configuration:\n${issues}`);
  }

  const parsed = result.data;
  const isProduction = parsed.NODE_ENV === "production";
  let authSecret = process.env.AUTH_SECRET;

  if (!authSecret) {
    if (isProduction) {
      throw new Error(
        "AUTH_SECRET is required in production. Generate one with `openssl rand -base64 32`.",
      );
    }

    authSecret = DEVELOPMENT_FALLBACK_SECRET;

    if (!warnedAboutFallbackSecret) {
      warnedAboutFallbackSecret = true;
      console.warn(
        "[auth] AUTH_SECRET is not set. Using the development fallback secret; set AUTH_SECRET before deploying.",
      );
    }
  }

  if (authSecret.length < 32 && isProduction) {
    throw new Error("AUTH_SECRET must be at least 32 characters long.");
  }

  return {
    ...parsed,
    AUTH_SECRET: authSecret,
    isProduction,
    isMailTransportConfigured: Boolean(parsed.SMTP_HOST),
  };
}
