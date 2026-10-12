import { baseApi } from "@/store/base-api";
import type { OAuthProviderId } from "@/types/oauth";

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  isEmailVerified: boolean;
  role: string;
  hasPassword: boolean;
  linkedProviders: OAuthProviderId[];
  createdAt: string | null;
}

export interface CurrentUserResponse {
  user: PublicUser | null;
}

export interface AuthUserResponse {
  user: PublicUser;
}

export interface SignupPayload {
  name: string;
  email: string;
  password: string;
}

export interface SignupResponse {
  email: string;
  emailMasked: string;
  resendAvailableInSeconds: number;
  expiresInSeconds: number;
  devOtp?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface VerifyOtpPayload {
  code: string;
}

export interface ResendOtpResponse {
  emailMasked: string;
  resendAvailableInSeconds: number;
  expiresInSeconds: number;
  devOtp?: string;
}

export interface OtpStatusResponse {
  emailMasked: string;
  isEmailVerified: boolean;
  resendAvailableInSeconds: number;
  expiresInSeconds: number;
}

export interface LogoutResponse {
  loggedOut: true;
}

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    signup: build.mutation<SignupResponse, SignupPayload>({
      query: (body) => ({ url: "/auth/signup", method: "POST", body }),
    }),
    login: build.mutation<AuthUserResponse, LoginPayload>({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
      invalidatesTags: ["Session"],
    }),
    logout: build.mutation<LogoutResponse, void>({
      query: () => ({ url: "/auth/logout", method: "POST" }),
      invalidatesTags: ["Session"],
    }),
    verifyOtp: build.mutation<AuthUserResponse, VerifyOtpPayload>({
      query: (body) => ({ url: "/auth/verify-otp", method: "POST", body }),
      invalidatesTags: ["Session"],
    }),
    resendOtp: build.mutation<ResendOtpResponse, void>({
      query: () => ({ url: "/auth/resend-otp", method: "POST" }),
    }),
    getCurrentUser: build.query<CurrentUserResponse, void>({
      query: () => "/auth/me",
      providesTags: ["Session"],
    }),
    getOtpStatus: build.query<OtpStatusResponse, void>({
      query: () => "/auth/otp-status",
    }),
  }),
});

export const {
  useSignupMutation,
  useLoginMutation,
  useLogoutMutation,
  useVerifyOtpMutation,
  useResendOtpMutation,
  useGetCurrentUserQuery,
  useGetOtpStatusQuery,
} = authApi;
