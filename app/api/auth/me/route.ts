import { handleRouteError, jsonSuccess } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/auth/session";
import type { CurrentUserResponse } from "@/store/features/auth-api";

export async function GET() {
  try {
    const user = await getCurrentUser();
    const response: CurrentUserResponse = { user };

    return jsonSuccess(response);
  } catch (error) {
    return handleRouteError(error);
  }
}
