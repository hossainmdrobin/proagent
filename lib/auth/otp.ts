import "server-only";

import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { connectToDatabase } from "@/lib/db";
import { EmailOtpModel } from "@/lib/models/email-otp";
import {
  OTP_EXPIRY_MS,
  OTP_LENGTH,
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_COOLDOWN_SECONDS,
} from "@/lib/constants";

function generateOtpCode(): string {
  const upperBound = 10 ** OTP_LENGTH;
  return String(randomInt(0, upperBound)).padStart(OTP_LENGTH, "0");
}

function hashOtpCode(email: string, code: string, secret: string): string {
  return createHmac("sha256", secret).update(`${email}:${code}`).digest("hex");
}

function getResendCooldownRemainingSeconds(lastSentAt?: Date): number {
  if (!lastSentAt) {
    return 0;
  }

  const remaining = OTP_RESEND_COOLDOWN_SECONDS * 1000 - (Date.now() - lastSentAt.getTime());

  return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
}

export async function getOtpResendState(email: string): Promise<{
  resendAvailableInSeconds: number;
  expiresInSeconds: number;
}> {
  await connectToDatabase();
  const record = await EmailOtpModel.findOne({ email }).select("lastSentAt expiresAt").lean();

  const remainingLifetime = record ? record.expiresAt.getTime() - Date.now() : 0;

  return {
    resendAvailableInSeconds: getResendCooldownRemainingSeconds(record?.lastSentAt),
    expiresInSeconds: remainingLifetime > 0 ? Math.ceil(remainingLifetime / 1000) : 0,
  };
}

export async function issueEmailOtp(input: {
  email: string;
  secret: string;
}): Promise<{ code: string; expiresAt: Date }> {
  await connectToDatabase();

  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

  await EmailOtpModel.updateOne(
    { email: input.email },
    {
      $set: {
        email: input.email,
        codeHash: hashOtpCode(input.email, code, input.secret),
        attempts: 0,
        expiresAt,
        lastSentAt: new Date(),
      },
      $unset: { consumedAt: 1 },
    },
    { upsert: true, setDefaultsOnInsert: true },
  );

  return { code, expiresAt };
}

export type OtpVerificationFailure =
  | "NOT_FOUND"
  | "INVALID_OTP"
  | "EXPIRED"
  | "TOO_MANY_ATTEMPTS";

export async function verifyEmailOtp(input: {
  email: string;
  code: string;
  secret: string;
}): Promise<
  | { success: true }
  | { success: false; reason: OtpVerificationFailure; attemptsRemaining: number }
> {
  await connectToDatabase();

  const record = await EmailOtpModel.findOne({ email: input.email });

  if (!record || record.consumedAt) {
    return { success: false, reason: "NOT_FOUND", attemptsRemaining: 0 };
  }

  if (record.expiresAt.getTime() <= Date.now()) {
    return { success: false, reason: "EXPIRED", attemptsRemaining: 0 };
  }

  if (record.attempts >= OTP_MAX_ATTEMPTS) {
    return { success: false, reason: "TOO_MANY_ATTEMPTS", attemptsRemaining: 0 };
  }

  const expected = Buffer.from(record.codeHash, "hex");
  const received = Buffer.from(hashOtpCode(input.email, input.code, input.secret), "hex");

  if (!timingSafeEqual(expected, received)) {
    record.attempts += 1;
    await record.save();

    return {
      success: false,
      reason: "INVALID_OTP",
      attemptsRemaining: Math.max(0, OTP_MAX_ATTEMPTS - record.attempts),
    };
  }

  await EmailOtpModel.deleteOne({ _id: record._id });

  return { success: true };
}
