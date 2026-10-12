import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/db";
import { UserModel } from "@/lib/models/user";
import { SessionModel } from "@/lib/models/session";
import { getServerEnv } from "@/lib/env";
import type { User } from "@/lib/models/user";
import { generateSecureToken, hashToken } from "@/lib/auth/tokens";
import { createSignedValue, readSignedValue } from "@/lib/auth/tokens";
import type { OAuthProviderId } from "@/types/oauth";
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  VERIFICATION_COOKIE_NAME,
  VERIFICATION_MAX_AGE_SECONDS,
} from "@/lib/constants";

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  isEmailVerified: boolean;
  role: string;
  hasPassword: boolean;
  linkedProviders: OAuthProviderId[];
  createdAt: string | null;
}

export interface SessionContext {
  sessionId: string;
  userId: string;
  expiresAt: string;
}

interface VerificationCookiePayload extends Record<string, unknown> {
  userId: string;
}

export function toPublicUser(user: User): PublicUser {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    isEmailVerified: user.isEmailVerified,
    role: user.role,
    hasPassword: Boolean(user.passwordHash),
    linkedProviders: [...new Set((user.providers ?? []).map((entry) => entry.provider))],
    createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : null,
  };
}

function sessionCookieOptions(maxAge: number) {
  const { isProduction } = getServerEnv();

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export async function createSession(input: {
  userId: string;
  ip?: string;
  userAgent?: string;
}): Promise<{ token: string; expiresAt: Date }> {
  await connectToDatabase();

  const token = generateSecureToken();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  await SessionModel.create({
    userId: input.userId,
    tokenHash: hashToken(token),
    expiresAt,
    userAgent: input.userAgent?.slice(0, 255),
    ip: input.ip,
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, sessionCookieOptions(SESSION_MAX_AGE_SECONDS));

  return { token, expiresAt };
}

export async function readSession(): Promise<SessionContext | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  await connectToDatabase();

  const session = await SessionModel.findOne({ tokenHash: hashToken(token) })
    .select("userId expiresAt revokedAt")
    .lean();

  if (!session || session.revokedAt || session.expiresAt.getTime() <= Date.now()) {
    return null;
  }

  return {
    sessionId: session._id.toString(),
    userId: session.userId.toString(),
    expiresAt: session.expiresAt.toISOString(),
  };
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    await connectToDatabase();
    await SessionModel.deleteOne({ tokenHash: hashToken(token) });
  }

  cookieStore.set(SESSION_COOKIE_NAME, "", sessionCookieOptions(0));
}

export async function startVerificationSession(userId: string): Promise<void> {
  const { AUTH_SECRET } = getServerEnv();
  const cookieStore = await cookies();

  cookieStore.set(
    VERIFICATION_COOKIE_NAME,
    createSignedValue<VerificationCookiePayload>({ userId }, AUTH_SECRET),
    sessionCookieOptions(VERIFICATION_MAX_AGE_SECONDS),
  );
}

export async function readVerificationSession(): Promise<{ userId: string } | null> {
  const { AUTH_SECRET } = getServerEnv();
  const cookieStore = await cookies();
  const value = cookieStore.get(VERIFICATION_COOKIE_NAME)?.value;
  const payload = readSignedValue<VerificationCookiePayload>(value, AUTH_SECRET);

  if (!payload?.userId || typeof payload.userId !== "string") {
    return null;
  }

  return { userId: payload.userId };
}

export async function endVerificationSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(VERIFICATION_COOKIE_NAME, "", sessionCookieOptions(0));
}

export async function getCurrentUser(): Promise<PublicUser | null> {
  const session = await readSession();

  if (!session) {
    return null;
  }

  await connectToDatabase();
  const user = await UserModel.findById(session.userId).select("+passwordHash");

  return user ? toPublicUser(user) : null;
}

export async function peekAuthenticatedUser(): Promise<PublicUser | null> {
  try {
    return await getCurrentUser();
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      (error as { digest?: unknown }).digest === "DYNAMIC_SERVER_USAGE"
    ) {
      throw error;
    }

    console.error("[auth] Failed to resolve the current user:", error);
    return null;
  }
}

export async function requireSession(): Promise<SessionContext> {
  const session = await readSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}
