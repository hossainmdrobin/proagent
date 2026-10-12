import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ApiError, jsonError } from "@/lib/api-response";
import { getServerEnv } from "@/lib/env";
import { buildAuthorizationUrl } from "@/lib/oauth/oauth";
import { getOAuthProvider, getProviderRedirectUri, isProviderConfigured } from "@/lib/oauth/providers";
import {
  createCodeChallenge,
  createCodeVerifier,
  createStateToken,
  encodeOAuthState,
  OAUTH_COOKIE_PATH,
  OAUTH_STATE_COOKIE_NAME,
  OAUTH_STATE_MAX_AGE_SECONDS,
  sanitizeReturnTo,
} from "@/lib/oauth/state";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider: providerId } = await params;
  const provider = getOAuthProvider(providerId);

  if (!provider) {
    return jsonError(
      new ApiError(404, "UNKNOWN_PROVIDER", "That sign-in provider is not supported."),
    );
  }

  if (!isProviderConfigured(provider)) {
    const prefix = provider.id.toUpperCase();

    return jsonError(
      new ApiError(
        503,
        "PROVIDER_NOT_CONFIGURED",
        `${provider.label} sign-in is not configured. Set ${prefix}_CLIENT_ID and ${prefix}_CLIENT_SECRET.`,
      ),
    );
  }

  const url = new URL(request.url);
  const state = createStateToken();
  const codeVerifier = createCodeVerifier();
  const redirectUri = getProviderRedirectUri(provider.id);
  const cookieStore = await cookies();

  cookieStore.set(
    OAUTH_STATE_COOKIE_NAME,
    encodeOAuthState({
      provider: provider.id,
      state,
      codeVerifier,
      returnTo: sanitizeReturnTo(url.searchParams.get("returnTo")),
      from: url.searchParams.get("from") === "signup" ? "signup" : "login",
    }),
    {
      httpOnly: true,
      secure: getServerEnv().isProduction,
      sameSite: "lax",
      path: OAUTH_COOKIE_PATH,
      maxAge: OAUTH_STATE_MAX_AGE_SECONDS,
    },
  );

  return NextResponse.redirect(
    buildAuthorizationUrl({
      provider,
      redirectUri,
      state,
      codeChallenge: createCodeChallenge(codeVerifier),
    }),
  );
}