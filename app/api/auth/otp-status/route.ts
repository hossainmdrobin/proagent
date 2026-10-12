import { ApiError, handleRouteError, jsonSuccess } from "@/lib/api-response";
import { findUserById } from "@/lib/auth/service";
import { readVerificationSession } from "@/lib/auth/session";
import { getOtpResendState } from "@/lib/auth/otp";
import { maskEmail } from "@/lib/format";
import type { OtpStatusResponse } from "@/store/features/auth-api";

export async function GET() {
  try {
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

    const otpState = await getOtpResendState(user.email);

    const response: OtpStatusResponse = {
      emailMasked: maskEmail(user.email),
      isEmailVerified: user.isEmailVerified,
      resendAvailableInSeconds: otpState.resendAvailableInSeconds,
      expiresInSeconds: otpState.expiresInSeconds,
    };

    return jsonSuccess(response);
  } catch (error) {
    return handleRouteError(error);
  }
}
