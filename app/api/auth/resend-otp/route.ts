import {
  ApiError,
  enforceRateLimits,
  handleRouteError,
  jsonError,
  jsonSuccess,
} from "@/lib/api-response";
import { deliverVerificationEmail, findUserById } from "@/lib/auth/service";
import { readVerificationSession, startVerificationSession } from "@/lib/auth/session";
import { getOtpResendState } from "@/lib/auth/otp";
import { maskEmail } from "@/lib/format";
import { HOUR } from "@/lib/constants";
import type { ResendOtpResponse } from "@/store/features/auth-api";

export async function POST(request: Request) {
  try {
    const rateLimitError = enforceRateLimits(request, {
      scope: "resend-otp",
      limit: 5,
      windowMs: HOUR,
    });

    if (rateLimitError) {
      return jsonError(rateLimitError);
    }

    const verificationSession = await readVerificationSession();

    if (!verificationSession) {
      throw new ApiError(
        401,
        "VERIFICATION_SESSION_EXPIRED",
        "Your verification session expired. Sign in to request a new code.",
      );
    }

    const user = await findUserById(verificationSession.userId);

    if (!user) {
      throw new ApiError(
        401,
        "VERIFICATION_SESSION_EXPIRED",
        "Your verification session expired. Sign in to request a new code.",
      );
    }

    if (user.isEmailVerified) {
      throw new ApiError(409, "ALREADY_VERIFIED", "This email address is already verified.");
    }

    const beforeResend = await getOtpResendState(user.email);

    if (beforeResend.resendAvailableInSeconds > 0) {
      throw new ApiError(
        429,
        "OTP_COOLDOWN",
        `Please wait ${beforeResend.resendAvailableInSeconds}s before requesting another code.`,
        { headers: { "Retry-After": String(beforeResend.resendAvailableInSeconds) } },
      );
    }

    const { previewCode } = await deliverVerificationEmail(user);
    await startVerificationSession(user._id.toString());
    const otpState = await getOtpResendState(user.email);

    const response: ResendOtpResponse = {
      emailMasked: maskEmail(user.email),
      resendAvailableInSeconds: otpState.resendAvailableInSeconds,
      expiresInSeconds: otpState.expiresInSeconds,
      ...(previewCode ? { devOtp: previewCode } : {}),
    };

    return jsonSuccess(response);
  } catch (error) {
    return handleRouteError(error);
  }
}
