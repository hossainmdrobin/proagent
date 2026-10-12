import "server-only";

import { ApiError } from "@/lib/api-response";
import type { OAuthProviderConfig } from "@/lib/oauth/providers";
import type { OAuthProviderId } from "@/types/oauth";

export interface OAuthProfile {
  providerAccountId: string;
  email: string | null;
  emailVerified: boolean;
  name: string | null;
  avatarUrl: string | null;
}

interface GoogleUserInfo {
  sub?: string;
  email?: string;
  email_verified?: boolean | string;
  name?: string;
  picture?: string;
}

interface FacebookUserInfo {
  id?: string;
  name?: string;
  email?: string;
  picture?: { data?: { url?: string } };
}

interface GitHubUserInfo {
  id?: number | string;
  login?: string;
  name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
}

interface GitHubEmail {
  email?: string;
  primary?: boolean;
  verified?: boolean;
  visibility?: string | null;
}

interface TokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

function buildUrl(base: string, params: Record<string, string>): string {
  const url = new URL(base);

  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  return url.toString();
}

export function buildAuthorizationUrl(input: {
  provider: OAuthProviderConfig;
  redirectUri: string;
  state: string;
  codeChallenge: string;
}): string {
  return buildUrl(input.provider.endpoints.authorizeUrl, {
    response_type: "code",
    client_id: input.provider.clientId,
    redirect_uri: input.redirectUri,
    scope: input.provider.scopes.join(" "),
    state: input.state,
    code_challenge: input.codeChallenge,
    code_challenge_method: "S256",
  });
}

function parseTokenResponse(raw: string): TokenResponse {
  try {
    return JSON.parse(raw) as TokenResponse;
  } catch {
    return Object.fromEntries(new URLSearchParams(raw)) as TokenResponse;
  }
}

export async function exchangeAuthorizationCode(input: {
  provider: OAuthProviderConfig;
  code: string;
  codeVerifier: string;
  redirectUri: string;
}): Promise<string> {
  const response = await fetch(input.provider.endpoints.tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: input.code,
      redirect_uri: input.redirectUri,
      client_id: input.provider.clientId,
      client_secret: input.provider.clientSecret,
      code_verifier: input.codeVerifier,
    }),
    cache: "no-store",
  });

  const payload = parseTokenResponse(await response.text());

  if (!response.ok || !payload.access_token) {
    throw new ApiError(
      502,
      "OAUTH_EXCHANGE_FAILED",
      `${input.provider.label} rejected the authorization code.`,
    );
  }

  return payload.access_token;
}

async function fetchJson<T>(url: string, accessToken: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new ApiError(
      502,
      "OAUTH_PROFILE_FAILED",
      "The provider profile could not be read.",
    );
  }

  return (await response.json()) as T;
}

function normalizeEmail(value: string | null | undefined): string | null {
  const trimmed = value?.trim().toLowerCase();

  return trimmed && trimmed.includes("@") ? trimmed : null;
}

function selectGitHubEmails(emails: GitHubEmail[]): {
  email: string | null;
  verified: boolean;
} {
  const primary = emails.find((entry) => entry.primary && entry.verified);
  const anyVerified = emails.find((entry) => entry.verified);
  const chosen = primary ?? anyVerified;

  if (chosen) {
    return { email: normalizeEmail(chosen.email), verified: true };
  }

  const primaryUnverified = emails.find((entry) => entry.primary) ?? emails[0];

  return {
    email: normalizeEmail(primaryUnverified?.email),
    verified: false,
  };
}

export async function fetchOAuthProfile(input: {
  providerId: OAuthProviderId;
  provider: OAuthProviderConfig;
  accessToken: string;
}): Promise<OAuthProfile> {
  if (input.providerId === "google") {
    const profile = await fetchJson<GoogleUserInfo>(
      input.provider.endpoints.userInfoUrl,
      input.accessToken,
    );

    return {
      providerAccountId: String(profile.sub ?? ""),
      email: normalizeEmail(profile.email),
      emailVerified: profile.email_verified === true || profile.email_verified === "true",
      name: profile.name?.trim() || null,
      avatarUrl: profile.picture ?? null,
    };
  }

  if (input.providerId === "facebook") {
    const userInfoUrl = buildUrl(input.provider.endpoints.userInfoUrl, {
      fields: "id,name,email,picture.type(large)",
    });
    const profile = await fetchJson<FacebookUserInfo>(userInfoUrl, input.accessToken);

    return {
      providerAccountId: String(profile.id ?? ""),
      email: normalizeEmail(profile.email),
      emailVerified: false,
      name: profile.name?.trim() || null,
      avatarUrl: profile.picture?.data?.url ?? null,
    };
  }

  const userInfoUrl = buildUrl(input.provider.endpoints.userInfoUrl, {
    per_page: "1",
  });
  const profile = await fetchJson<GitHubUserInfo>(userInfoUrl, input.accessToken);
  const emailsUrl = input.provider.endpoints.userEmailsUrl;

  if (!emailsUrl) {
    return {
      providerAccountId: String(profile.id ?? ""),
      email: normalizeEmail(profile.email),
      emailVerified: false,
      name: profile.name?.trim() || profile.login?.trim() || null,
      avatarUrl: profile.avatar_url ?? null,
    };
  }

  const emails = await fetchJson<GitHubEmail[]>(emailsUrl, input.accessToken);
  const selection = selectGitHubEmails(Array.isArray(emails) ? emails : []);

  return {
    providerAccountId: String(profile.id ?? ""),
    email: selection.email ?? normalizeEmail(profile.email),
    emailVerified: selection.verified,
    name: profile.name?.trim() || profile.login?.trim() || null,
    avatarUrl: profile.avatar_url ?? null,
  };
}