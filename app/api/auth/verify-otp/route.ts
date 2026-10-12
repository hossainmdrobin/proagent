import {
  ApiError,
  enforceRateLimits,
  handleRouteError,
  jsonError,
  jsonSuccess,
  readJsonBody,
} from "@/lib/api-response";
import { findUserById, verifyUserOtp } from "@/lib/auth/service";
import {
  createSession,
  endVerificationSession,
  readVerificationSession,
  toPublicUser,
} from "@/lib/auth/session";
import { getClientIp } from "@/lib/rate-limit";
import { verifyOtpSchema } from "@/lib/validation/auth";
import { MINUTE } from "@/lib/constants";
import type { AuthUserResponse } from "@/store/features/auth-api";

const VERIFICATION_SESSION_EXPIRED = new ApiError(
  401,
  "VERIFICATION_SESSION_EXPIRED",
  "Your verification session expired. Sign in to request a new code.",
);

export async function POST(request: Request) {
  try {
    const rateLimitError = enforceRateLimits(request, {
      scope: "verify-otp",
      limit: 10,
      windowMs: 15 * MINUTE,
    });

    if (rateLimitError) {
      return jsonError(rateLimitError);
    }

    const { code } = verifyOtpSchema.parse(await readJsonBody(request));
    const verificationSession = await readVerificationSession();

    if (!verificationSession) {
      throw VERIFICATION_SESSION_EXPIRED;
    }

    const user = await findUserById(verificationSession.userId);

    if (!user) {
      throw VERIFICATION_SESSION_EXPIRED;
    }

    if (user.isEmailVerified) {
      await createSession({ userId: user._id.toString() });
      await endVerificationSession();

      return jsonSuccess<AuthUserResponse>({ user: toPublicUser(user) });
    }

    const result = await verifyUserOtp({
      userId: user._id.toString(),
      email: user.email,
      code,
    });

    if (result.status === "failure") {
      if (result.reason === "INVALID_OTP") {
        throw new ApiError(
          400,
          "INVALID_OTP",
          `That code is not correct. ${result.attemptsRemaining} attempt${
            result.attemptsRemaining === 1 ? "" : "s"
          } remaining.`,
        );
      }

      if (result.reason === "EXPIRED") {
        throw new ApiError(410, "OTP_EXPIRED", "That code expired. Request a new one.");
      }

      if (result.reason === "TOO_MANY_ATTEMPTS") {
        throw new ApiError(429, "TOO_MANY_ATTEMPTS", "Too many incorrect attempts. Request a new code.");
      }

      throw new ApiError(400, "INVALID_OTP", "Enter the code from your verification email.");
    }

    await createSession({
      userId: user._id.toString(),
      ip: getClientIp(request),
      userAgent: request.headers.get("user-agent") ?? undefined,
    });
    await endVerificationSession();

    const response: AuthUserResponse = {
      user: { ...toPublicUser(user), isEmailVerified: true },
    };

    return jsonSuccess(response);
  } catch (error) {
    return handleRouteError(error);
  }
}
