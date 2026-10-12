"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { OtpInput } from "@/components/auth/otp-input";
import { useCountdown } from "@/components/auth/use-countdown";
import { useToast } from "@/components/providers/toast-provider";
import { asApiError } from "@/lib/api-client";
import { formatCountdown } from "@/lib/format";
import {
  useGetOtpStatusQuery,
  useResendOtpMutation,
  useVerifyOtpMutation,
} from "@/store/features/auth-api";
import { sessionLoaded, setPendingVerificationEmail } from "@/store/features/auth-slice";
import { useAppDispatch } from "@/store/hooks";
import { OTP_RESEND_COOLDOWN_SECONDS } from "@/lib/constants";
import { otpCodeSchema } from "@/lib/validation/auth";

export interface VerifyOtpFormProps {
  emailMasked: string | null;
  initialCode?: string | null;
}

export function VerifyOtpForm({ emailMasked, initialCode }: VerifyOtpFormProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { pushToast } = useToast();
  const [code, setCode] = useState(initialCode ?? "");
  const [formError, setFormError] = useState<string | null>(null);
  const [codeIsInvalid, setCodeIsInvalid] = useState(false);
  const { seconds, isCoolingDown, reset } = useCountdown();
  const hasSeededCountdown = useRef(false);

  const {
    data: otpStatus,
    isError: statusIsError,
    error: statusError,
  } = useGetOtpStatusQuery();
  const [verifyOtp, { isLoading: isVerifying }] = useVerifyOtpMutation();
  const [resendOtp, { isLoading: isResending }] = useResendOtpMutation();

  useEffect(() => {
    if (otpStatus && !hasSeededCountdown.current) {
      hasSeededCountdown.current = true;
      reset(otpStatus.resendAvailableInSeconds);
    }
  }, [otpStatus, reset]);

  const verificationExpired =
    statusIsError && asApiError(statusError).code === "VERIFICATION_SESSION_EXPIRED";

  async function handleVerify(otp: string) {
    setFormError(null);
    setCodeIsInvalid(false);

    const parsed = otpCodeSchema.safeParse(otp);

    if (!parsed.success) {
      setCodeIsInvalid(true);
      return;
    }

    try {
      const response = await verifyOtp({ code: parsed.data }).unwrap();

      dispatch(sessionLoaded(response.user));
      dispatch(setPendingVerificationEmail(null));
      pushToast({
        variant: "success",
        title: "Email verified",
        description: "Your account is ready to use.",
      });

      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      const apiError = asApiError(error);
      setFormError(apiError.message);

      if (apiError.code === "INVALID_OTP" || apiError.code === "OTP_EXPIRED") {
        setCode("");
        setCodeIsInvalid(true);
      }

      if (apiError.code === "OTP_COOLDOWN" || apiError.code === "TOO_MANY_ATTEMPTS") {
        reset(OTP_RESEND_COOLDOWN_SECONDS);
      }

      if (apiError.code === "VERIFICATION_SESSION_EXPIRED") {
        setCodeIsInvalid(true);
      }
    }
  }

  async function handleResend() {
    setFormError(null);

    try {
      const response = await resendOtp().unwrap();
      reset(response.resendAvailableInSeconds);
      pushToast({
        variant: "success",
        title: "New code sent",
        description: `Check ${response.emailMasked} for a fresh verification code.`,
      });
    } catch (error) {
      const apiError = asApiError(error);
      setFormError(apiError.message);
      reset(OTP_RESEND_COOLDOWN_SECONDS);
    }
  }

  if (verificationExpired) {
    return (
      <Alert variant="info" title="Verification session expired">
        Start again from{" "}
        <Link href="/login" className="font-medium underline underline-offset-4">
          sign in
        </Link>{" "}
        to request a new verification code.
      </Alert>
    );
  }

  if (otpStatus?.isEmailVerified) {
    return (
      <Alert variant="success" title="Email already verified">
        Your account is ready.{" "}
        <Link href="/login" className="font-medium underline underline-offset-4">
          Sign in
        </Link>{" "}
        to continue.
      </Alert>
    );
  }

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        void handleVerify(code);
      }}
      noValidate
    >
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        We sent a 6-digit code to{" "}
        <span className="font-medium text-zinc-900 dark:text-zinc-100">
          {emailMasked ?? otpStatus?.emailMasked ?? "your email address"}
        </span>
        . It expires in 5 minutes.
      </p>

      {initialCode ? (
        <Alert variant="info">
          Development mode: your code was prefilled as{" "}
          <span className="font-semibold">{initialCode}</span> because SMTP is not
          configured.
        </Alert>
      ) : null}

      {formError ? <Alert variant="error">{formError}</Alert> : null}

      <OtpInput
        value={code}
        onChange={(value) => {
          setCode(value);
          if (codeIsInvalid) {
            setCodeIsInvalid(false);
          }
        }}
        onComplete={(value) => void handleVerify(value)}
        disabled={isVerifying}
        invalid={codeIsInvalid}
        autoFocus
      />

      {codeIsInvalid && !formError ? (
        <p role="alert" className="text-center text-xs font-medium text-red-600 dark:text-red-400">
          Enter the 6-digit code from your email.
        </p>
      ) : null}

      <Button type="submit" size="lg" isLoading={isVerifying} disabled={isVerifying}>
        {isVerifying ? "Verifying..." : "Verify email"}
      </Button>

      <div className="flex flex-col items-center gap-1">
        <Button
          variant="ghost"
          onClick={() => void handleResend()}
          isLoading={isResending}
          disabled={isCoolingDown || isResending}
        >
          {isResending ? "Sending..." : "Resend code"}
        </Button>
        {isCoolingDown ? (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            You can request a new code in {formatCountdown(seconds)}.
          </p>
        ) : (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Codes can be requested once every {OTP_RESEND_COOLDOWN_SECONDS} seconds.
          </p>
        )}
      </div>
    </form>
  );
}
