import { handleRouteError, jsonSuccess } from "@/lib/api-response";
import { destroySession } from "@/lib/auth/session";
import type { LogoutResponse } from "@/store/features/auth-api";

export async function POST() {
  try {
    await destroySession();

    const response: LogoutResponse = { loggedOut: true };

    return jsonSuccess(response);
  } catch (error) {
    return handleRouteError(error);
  }
}
