import "server-only";

import { connectToDatabase } from "@/lib/db";
import { UserModel } from "@/lib/models/user";
import type { User } from "@/lib/models/user";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { issueEmailOtp, verifyEmailOtp } from "@/lib/auth/otp";
import { sendOtpEmail } from "@/lib/mail/send-otp-email";
import { getServerEnv } from "@/lib/env";
import {
  LOGIN_LOCK_DURATION_MS,
  LOGIN_MAX_FAILED_ATTEMPTS,
} from "@/lib/constants";

export class MailDeliveryError extends Error {
  constructor() {
    super("The verification email could not be sent.");
    this.name = "MailDeliveryError";
  }
}

export async function findUserByEmail(email: string): Promise<User | null> {
  await connectToDatabase();
  return UserModel.findOne({ email });
}

export async function findUserById(userId: string): Promise<User | null> {
  await connectToDatabase();
  return UserModel.findById(userId).select("+passwordHash");
}

export async function createUser(input: {
  name: string;
  email: string;
  password: string;
}): Promise<User> {
  await connectToDatabase();
  const passwordHash = await hashPassword(input.password);

  return UserModel.create({
    name: input.name,
    email: input.email,
    passwordHash,
  });
}

export async function deleteUser(userId: string): Promise<void> {
  await connectToDatabase();
  await UserModel.deleteOne({ _id: userId });
}

export async function deliverVerificationEmail(user: {
  name: string;
  email: string;
}): Promise<{ previewCode?: string }> {
  const { AUTH_SECRET } = getServerEnv();
  const { code } = await issueEmailOtp({ email: user.email, secret: AUTH_SECRET });

  try {
    const result = await sendOtpEmail({ to: user.email, name: user.name, code });
    return { previewCode: result.previewCode };
  } catch (error) {
    console.error("[auth] Failed to send verification email:", error);
    throw new MailDeliveryError();
  }
}

export async function markEmailVerified(userId: string): Promise<void> {
  await connectToDatabase();
  await UserModel.updateOne(
    { _id: userId },
    { $set: { isEmailVerified: true }, $unset: { lockedUntil: 1 } },
  );
}

export type LoginOutcome =
  | { status: "success"; user: User }
  | { status: "invalid" }
  | { status: "locked"; retryAfterSeconds: number }
  | { status: "unverified"; user: User };

export async function loginWithPassword(input: {
  email: string;
  password: string;
}): Promise<LoginOutcome> {
  await connectToDatabase();

  const user = await UserModel.findOne({ email: input.email }).select("+passwordHash");

  if (!user) {
    return { status: "invalid" };
  }

  if (user.lockedUntil && user.lockedUntil.getTime() > Date.now()) {
    return {
      status: "locked",
      retryAfterSeconds: Math.ceil((user.lockedUntil.getTime() - Date.now()) / 1000),
    };
  }

  if (!user.passwordHash) {
    return { status: "invalid" };
  }

  const passwordMatches = await verifyPassword(input.password, user.passwordHash);

  if (!passwordMatches) {
    user.failedLoginCount += 1;

    if (user.failedLoginCount >= LOGIN_MAX_FAILED_ATTEMPTS) {
      user.lockedUntil = new Date(Date.now() + LOGIN_LOCK_DURATION_MS);
      user.failedLoginCount = 0;
    }

    await user.save();
    return { status: "invalid" };
  }

  user.failedLoginCount = 0;
  user.lockedUntil = undefined;
  user.lastLoginAt = new Date();

  if (!user.isEmailVerified) {
    await user.save();
    return { status: "unverified", user };
  }

  await user.save();
  return { status: "success", user };
}

export async function verifyUserOtp(input: {
  userId: string;
  email: string;
  code: string;
}): Promise<
  | { status: "success" }
  | { status: "failure"; reason: "NOT_FOUND" | "INVALID_OTP" | "EXPIRED" | "TOO_MANY_ATTEMPTS"; attemptsRemaining: number }
> {
  const { AUTH_SECRET } = getServerEnv();
  const result = await verifyEmailOtp({
    email: input.email,
    code: input.code,
    secret: AUTH_SECRET,
  });

  if (result.success) {
    await markEmailVerified(input.userId);
    return { status: "success" };
  }

  return {
    status: "failure",
    reason: result.reason,
    attemptsRemaining: result.attemptsRemaining,
  };
}
