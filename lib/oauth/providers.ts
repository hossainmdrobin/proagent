import "server-only";

import { getServerEnv } from "@/lib/env";
import type { OAuthProviderId, PublicProviderInfo } from "@/types/oauth";

export interface OAuthProviderEndpoints {
  authorizeUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  userEmailsUrl?: string;
}

export interface OAuthProviderConfig {
  id: OAuthProviderId;
  label: string;
  clientId: string;
  clientSecret: string;
  scopes: string[];
  endpoints: OAuthProviderEndpoints;
}

const PROVIDER_IDS: OAuthProviderId[] = ["google", "facebook", "github"];

const PROVIDER_DEFAULTS: Record<
  OAuthProviderId,
  { label: string; scopes: string[]; endpoints: OAuthProviderEndpoints }
> = {
  google: {
    label: "Google",
    scopes: ["openid", "email", "profile"],
    endpoints: {
      authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      userInfoUrl: "https://openidconnect.googleapis.com/v1/userinfo",
    },
  },
  facebook: {
    label: "Facebook",
    scopes: ["email", "public_profile"],
    endpoints: {
      authorizeUrl: "https://www.facebook.com/v21.0/dialog/oauth",
      tokenUrl: "https://graph.facebook.com/v21.0/oauth/access_token",
      userInfoUrl: "https://graph.facebook.com/v21.0/me",
    },
  },
  github: {
    label: "GitHub",
    scopes: ["read:user", "user:email"],
    endpoints: {
      authorizeUrl: "https://github.com/login/oauth/authorize",
      tokenUrl: "https://github.com/login/oauth/access_token",
      userInfoUrl: "https://api.github.com/user",
      userEmailsUrl: "https://api.github.com/user/emails",
    },
  },
};

function readOptionalEnv(key: string): string | undefined {
  const value = process.env[key];
  return value && value.trim().length > 0 ? value.trim() : undefined;
}

function resolveEndpoints(id: OAuthProviderId): OAuthProviderEndpoints {
  const defaults = PROVIDER_DEFAULTS[id];
  const prefix = id.toUpperCase();

  return {
    authorizeUrl: readOptionalEnv(`${prefix}_AUTHORIZE_URL`) ?? defaults.endpoints.authorizeUrl,
    tokenUrl: readOptionalEnv(`${prefix}_TOKEN_URL`) ?? defaults.endpoints.tokenUrl,
    userInfoUrl: readOptionalEnv(`${prefix}_USERINFO_URL`) ?? defaults.endpoints.userInfoUrl,
    userEmailsUrl:
      readOptionalEnv(`${prefix}_USER_EMAILS_URL`) ?? defaults.endpoints.userEmailsUrl,
  };
}

export function isOAuthProviderId(value: string): value is OAuthProviderId {
  return (PROVIDER_IDS as string[]).includes(value);
}

export function getOAuthProvider(id: string): OAuthProviderConfig | null {
  if (!isOAuthProviderId(id)) {
    return null;
  }

  const prefix = id.toUpperCase();

  return {
    id,
    label: PROVIDER_DEFAULTS[id].label,
    clientId: readOptionalEnv(`${prefix}_CLIENT_ID`) ?? "",
    clientSecret: readOptionalEnv(`${prefix}_CLIENT_SECRET`) ?? "",
    scopes: PROVIDER_DEFAULTS[id].scopes,
    endpoints: resolveEndpoints(id),
  };
}

export function isProviderConfigured(provider: OAuthProviderConfig | null): boolean {
  return Boolean(provider?.clientId && provider.clientSecret);
}

export function getPublicProviderInfo(): PublicProviderInfo[] {
  return PROVIDER_IDS.map((id) => {
    const provider = getOAuthProvider(id);

    return {
      id,
      label: provider?.label ?? id,
      configured: isProviderConfigured(provider),
    };
  });
}

function stripTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

export function getAppBaseUrl(): string {
  const { NEXT_PUBLIC_APP_URL, APP_URL, isProduction } = getServerEnv();
  const configured = NEXT_PUBLIC_APP_URL ?? APP_URL;
  const vercelUrl = process.env.VERCEL_URL;

  if (configured) {
    return stripTrailingSlash(configured);
  }

  if (isProduction && vercelUrl) {
    return `https://${stripTrailingSlash(vercelUrl)}`;
  }

  return "http://localhost:3000";
}

export function getProviderRedirectUri(id: OAuthProviderId): string {
  return `${getAppBaseUrl()}/api/auth/oauth/${id}/callback`;
}