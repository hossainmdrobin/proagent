import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getServerEnv } from "@/lib/env";
import { getClientIp } from "@/lib/rate-limit";
import { authenticateWithProvider } from "@/lib/auth/social-auth";
import {
  createSession,
  endVerificationSession,
  startVerificationSession,
} from "@/lib/auth/session";
import { deliverVerificationEmail } from "@/lib/auth/service";
import { signaturesMatch } from "@/lib/auth/tokens";
import { exchangeAuthorizationCode, fetchOAuthProfile } from "@/lib/oauth/oauth";
import type { OAuthProfile } from "@/lib/oauth/oauth";
import { getOAuthProvider, getProviderRedirectUri, isProviderConfigured } from "@/lib/oauth/providers";
import { decodeOAuthState, OAUTH_COOKIE_PATH, OAUTH_STATE_COOKIE_NAME } from "@/lib/oauth/state";

function redirectWithError(
  request: Request,
  from: "login" | "signup",
  code: string,
): NextResponse {
  const target = new URL(`/${from}`, request.url);
  target.searchParams.set("oauthError", code);

  return NextResponse.redirect(target);
}

function redirectTo(target: string, request: Request): NextResponse {
  return NextResponse.redirect(new URL(target, request.url));
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider: providerId } = await params;
  const url = new URL(request.url);
  const cookieStore = await cookies();
  const storedState = cookieStore.get(OAUTH_STATE_COOKIE_NAME)?.value;
  const statePayload = decodeOAuthState(storedState);
  const from = statePayload?.from ?? "login";
  const isProduction = getServerEnv().isProduction;

  cookieStore.set(OAUTH_STATE_COOKIE_NAME, "", {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: OAUTH_COOKIE_PATH,
    maxAge: 0,
  });

  const provider = getOAuthProvider(providerId);

  if (!provider || !isProviderConfigured(provider)) {
    return redirectWithError(request, from, "not_configured");
  }

  const providerError = url.searchParams.get("error");

  if (providerError) {
    return redirectWithError(
      request,
      from,
      providerError === "access_denied" ? "cancelled" : "provider_error",
    );
  }

  if (!statePayload || statePayload.provider !== provider.id) {
    return redirectWithError(request, from, "invalid_state");
  }

  const state = url.searchParams.get("state");

  if (!state || !signaturesMatch(state, statePayload.state)) {
    return redirectWithError(request, from, "invalid_state");
  }

  const code = url.searchParams.get("code");

  if (!code) {
    return redirectWithError(request, from, "provider_error");
  }

  let profile: OAuthProfile;

  try {
    const accessToken = await exchangeAuthorizationCode({
      provider,
      code,
      codeVerifier: statePayload.codeVerifier,
      redirectUri: getProviderRedirectUri(provider.id),
    });

    profile = await fetchOAuthProfile({
      providerId: provider.id,
      provider,
      accessToken,
    });
  } catch (error) {
    console.error(`[oauth] ${provider.label} authorization failed:`, error);
    return redirectWithError(request, from, "exchange_failed");
  }

  try {
    const outcome = await authenticateWithProvider({
      provider: provider.id,
      providerLabel: provider.label,
      profile,
    });

    if (outcome.status === "error") {
      return redirectWithError(request, from, outcome.code);
    }

    if (outcome.status === "pending_verification") {
      const { previewCode } = await deliverVerificationEmail(outcome.user);
      await startVerificationSession(outcome.user._id.toString());
      const target = new URL("/verify-email", request.url);
      target.searchParams.set("email", outcome.user.email);

      if (previewCode) {
        target.searchParams.set("devOtp", previewCode);
      }

      return NextResponse.redirect(target);
    }

    await createSession({
      userId: outcome.user._id.toString(),
      ip: getClientIp(request),
      userAgent: request.headers.get("user-agent") ?? undefined,
    });
    await endVerificationSession();

    return redirectTo(statePayload.returnTo, request);
  } catch (error) {
    console.error(`[oauth] ${provider.label} sign-in failed: ${String((error as Error)?.stack)}`);
    return redirectWithError(request, from, "unexpected");
  }
}