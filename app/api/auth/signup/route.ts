import {
  ApiError,
  enforceRateLimits,
  handleRouteError,
  jsonError,
  jsonSuccess,
  readJsonBody,
} from "@/lib/api-response";
import {
  createUser,
  deliverVerificationEmail,
  deleteUser,
  findUserByEmail,
} from "@/lib/auth/service";
import { startVerificationSession } from "@/lib/auth/session";
import { getOtpResendState } from "@/lib/auth/otp";
import { signupSchema } from "@/lib/validation/auth";
import { maskEmail } from "@/lib/format";
import { HOUR } from "@/lib/constants";
import type { SignupResponse } from "@/store/features/auth-api";

export async function POST(request: Request) {
  try {
    const rateLimitError = enforceRateLimits(request, {
      scope: "signup",
      limit: 5,
      windowMs: HOUR,
    });

    if (rateLimitError) {
      return jsonError(rateLimitError);
    }

    const input = signupSchema.parse(await readJsonBody(request));
    const existingUser = await findUserByEmail(input.email);

    if (existingUser) {
      throw new ApiError(
        409,
        "EMAIL_TAKEN",
        "An account with this email already exists.",
      );
    }

    const user = await createUser(input);
    const userId = user._id.toString();

    try {
      const { previewCode } = await deliverVerificationEmail(user);
      await startVerificationSession(userId);
      const otpState = await getOtpResendState(input.email);

      const response: SignupResponse = {
        email: input.email,
        emailMasked: maskEmail(input.email),
        resendAvailableInSeconds: otpState.resendAvailableInSeconds,
        expiresInSeconds: otpState.expiresInSeconds,
        ...(previewCode ? { devOtp: previewCode } : {}),
      };

      return jsonSuccess(response, { status: 201 });
    } catch (error) {
      await deleteUser(userId);
      throw error;
    }
  } catch (error) {
    return handleRouteError(error);
  }
}
