import "server-only";

import { NextResponse } from "next/server";
import { z } from "zod";
import type { ApiFieldErrors } from "@/types/api";
import { checkRateLimits, rateLimitHeaders } from "@/lib/rate-limit";
import type { RateLimitRule } from "@/lib/rate-limit";

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fieldErrors?: ApiFieldErrors;
  readonly headers?: Record<string, string>;

  constructor(
    status: number,
    code: string,
    message: string,
    options?: { fieldErrors?: ApiFieldErrors; headers?: Record<string, string> },
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fieldErrors = options?.fieldErrors;
    this.headers = options?.headers;
  }
}

export function jsonSuccess<TData>(
  data: TData,
  init?: { status?: number; headers?: Record<string, string> },
): NextResponse {
  return NextResponse.json(
    { success: true, data },
    { status: init?.status ?? 200, headers: init?.headers },
  );
}

export function jsonError(error: ApiError): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        ...(error.fieldErrors ? { fieldErrors: error.fieldErrors } : {}),
      },
    },
    { status: error.status, headers: error.headers },
  );
}

export function enforceRateLimits(
  request: Request,
  rule: RateLimitRule,
  identifiers: Array<{ key: string; value: string }> = [],
): ApiError | null {
  const result = checkRateLimits(request, rule, identifiers);

  if (result.success) {
    return null;
  }

  return new ApiError(
    429,
    "TOO_MANY_REQUESTS",
    "Too many attempts. Please wait before trying again.",
    { headers: rateLimitHeaders(result) },
  );
}

export async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new ApiError(400, "INVALID_JSON", "Request body must be valid JSON.");
  }
}

export function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    (error as { code?: unknown }).code === 11000
  );
}

export function handleRouteError(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return jsonError(error);
  }

  if (error instanceof z.ZodError) {
    const { fieldErrors } = z.flattenError(error);

    return jsonError(
      new ApiError(422, "VALIDATION_ERROR", "Please check the highlighted fields.", {
        fieldErrors: fieldErrors as ApiFieldErrors,
      }),
    );
  }

  if (isDuplicateKeyError(error)) {
    return jsonError(
      new ApiError(409, "RESOURCE_CONFLICT", "That resource already exists."),
    );
  }

  console.error("[api] Unhandled route error:", error);

  return jsonError(
    new ApiError(500, "INTERNAL_ERROR", "Something went wrong. Please try again."),
  );
}
