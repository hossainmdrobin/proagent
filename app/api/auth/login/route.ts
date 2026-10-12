import {
  ApiError,
  enforceRateLimits,
  handleRouteError,
  jsonError,
  jsonSuccess,
  readJsonBody,
} from "@/lib/api-response";
import { loginWithPassword } from "@/lib/auth/service";
import {
  createSession,
  endVerificationSession,
  startVerificationSession,
  toPublicUser,
} from "@/lib/auth/session";
import { getClientIp } from "@/lib/rate-limit";
import { loginSchema } from "@/lib/validation/auth";
import { MINUTE } from "@/lib/constants";
import type { AuthUserResponse } from "@/store/features/auth-api";

export async function POST(request: Request) {
  try {
    const input = loginSchema.parse(await readJsonBody(request));

    const rateLimitError = enforceRateLimits(
      request,
      { scope: "login", limit: 10, windowMs: 15 * MINUTE },
      [{ key: "email", value: input.email }],
    );

    if (rateLimitError) {
      return jsonError(rateLimitError);
    }

    const outcome = await loginWithPassword(input);

    if (outcome.status === "invalid") {
      throw new ApiError(401, "INVALID_CREDENTIALS", "Email or password is incorrect.");
    }

    if (outcome.status === "locked") {
      throw new ApiError(
        429,
        "ACCOUNT_LOCKED",
        "Too many failed attempts. Try again in a few minutes.",
        { headers: { "Retry-After": String(outcome.retryAfterSeconds) } },
      );
    }

    if (outcome.status === "unverified") {
      await startVerificationSession(outcome.user._id.toString());

      throw new ApiError(
        403,
        "EMAIL_NOT_VERIFIED",
        "Verify your email address before signing in.",
        { fieldErrors: { email: ["This email address is not verified yet."] } },
      );
    }

    await createSession({
      userId: outcome.user._id.toString(),
      ip: getClientIp(request),
      userAgent: request.headers.get("user-agent") ?? undefined,
    });
    await endVerificationSession();

    const response: AuthUserResponse = { user: toPublicUser(outcome.user) };

    return jsonSuccess(response);
  } catch (error) {
    return handleRouteError(error);
  }
}
