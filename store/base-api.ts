import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query";
import type { ApiErrorShape, ApiFailureEnvelope } from "@/types/api";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "/api",
  credentials: "include",
  prepareHeaders(headers) {
    headers.set("Content-Type", "application/json");
    return headers;
  },
});

function normalizeError(error: FetchBaseQueryError): ApiErrorShape {
  const payload = error.data as Partial<ApiFailureEnvelope> | undefined;
  const failure = payload?.error;

  return {
    status: typeof error.status === "number" ? error.status : 500,
    code: failure?.code ?? "REQUEST_FAILED",
    message:
      failure?.message ??
      (typeof error.data === "string" && error.data
        ? error.data
        : "The request failed. Please try again."),
    ...(failure?.fieldErrors ? { fieldErrors: failure.fieldErrors } : {}),
  };
}

export const apiBaseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  ApiErrorShape
> = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);

  if (result.error) {
    return { error: normalizeError(result.error) };
  }

  const payload = result.data as
    | { success?: boolean; data?: unknown; error?: ApiFailureEnvelope["error"] }
    | undefined;

  if (payload && typeof payload === "object" && payload.success === true) {
    return { data: payload.data };
  }

  if (payload && typeof payload === "object" && payload.success === false) {
    const failure = payload.error ?? {
      code: "REQUEST_FAILED",
      message: "The request failed. Please try again.",
    };

    return {
      error: {
        status: 400,
        code: failure.code,
        message: failure.message,
        ...(failure.fieldErrors ? { fieldErrors: failure.fieldErrors } : {}),
      },
    };
  }

  return { data: result.data };
};

export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: apiBaseQuery,
  tagTypes: ["Agent", "Session"],
  endpoints: () => ({}),
});

export type AppBaseQuery = typeof apiBaseQuery;
