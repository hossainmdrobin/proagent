import { flattenError } from "zod";
import type { ZodError } from "zod";
import type { ApiErrorShape, ApiFieldErrors } from "@/types/api";
import { isApiErrorShape } from "@/types/api";

const FALLBACK_ERROR: ApiErrorShape = {
  status: 0,
  code: "UNKNOWN_ERROR",
  message: "Something went wrong. Please try again.",
};

export function asApiError(error: unknown): ApiErrorShape {
  return isApiErrorShape(error) ? error : FALLBACK_ERROR;
}

export function toFieldErrorMap(
  fieldErrors: ApiFieldErrors | undefined,
): Record<string, string> {
  if (!fieldErrors) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(fieldErrors)
      .filter((entry): entry is [string, string[]] => Boolean(entry[1]?.length))
      .map(([field, messages]) => [field, messages[0]]),
  );
}

export function zodFieldErrorMap(error: ZodError): Record<string, string> {
  return toFieldErrorMap(flattenError(error).fieldErrors as ApiFieldErrors);
}
