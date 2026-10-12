import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { getServerEnv } from "@/lib/env";
import { createSignedValue, readSignedValue } from "@/lib/auth/tokens";
import type { OAuthProviderId } from "@/types/oauth";

export const OAUTH_STATE_COOKIE_NAME = "saad_oauth_state";
export const OAUTH_STATE_MAX_AGE_SECONDS = 10 * 60;
export const OAUTH_COOKIE_PATH = "/api/auth/oauth";

export interface OAuthStatePayload extends Record<string, unknown> {
  provider: OAuthProviderId;
  state: string;
  codeVerifier: string;
  returnTo: string;
  from: "login" | "signup";
  issuedAt: number;
}

export function createCodeVerifier(): string {
  return randomBytes(32).toString("base64url");
}

export function createCodeChallenge(codeVerifier: string): string {
  return createHash("sha256").update(codeVerifier).digest("base64url");
}

export function createStateToken(): string {
  return randomBytes(24).toString("base64url");
}

export function sanitizeReturnTo(value: unknown): string {
  if (typeof value !== "string") {
    return "/dashboard";
  }

  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return "/dashboard";
  }

  return value;
}

export function encodeOAuthState(input: {
  provider: OAuthProviderId;
  state: string;
  codeVerifier: string;
  returnTo: string;
  from: "login" | "signup";
}): string {
  const { AUTH_SECRET } = getServerEnv();

  return createSignedValue<OAuthStatePayload>({ ...input, issuedAt: Date.now() }, AUTH_SECRET);
}

export function decodeOAuthState(value: string | undefined): OAuthStatePayload | null {
  if (!value) {
    return null;
  }

  const { AUTH_SECRET } = getServerEnv();
  const payload = readSignedValue<OAuthStatePayload>(value, AUTH_SECRET);

  if (
    !payload ||
    typeof payload.state !== "string" ||
    typeof payload.codeVerifier !== "string" ||
    typeof payload.provider !== "string" ||
    typeof payload.returnTo !== "string" ||
    (payload.from !== "login" && payload.from !== "signup")
  ) {
    return null;
  }

  const ageMs = Date.now() - payload.issuedAt;

  if (typeof payload.issuedAt !== "number" || ageMs < 0 || ageMs > OAUTH_STATE_MAX_AGE_SECONDS * 1000) {
    return null;
  }

  return payload;
}