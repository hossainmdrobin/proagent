"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordField } from "@/components/auth/password-field";
import { SocialAuthButtons } from "@/components/auth/social-auth-buttons";
import { useToast } from "@/components/providers/toast-provider";
import { asApiError, toFieldErrorMap, zodFieldErrorMap } from "@/lib/api-client";
import { getOAuthErrorMessage } from "@/lib/oauth/error-messages";
import { loginSchema } from "@/lib/validation/auth";
import { useLoginMutation } from "@/store/features/auth-api";
import { sessionLoaded, setPendingVerificationEmail } from "@/store/features/auth-slice";
import { useAppDispatch } from "@/store/hooks";
import type { PublicProviderInfo } from "@/types/oauth";

export interface LoginFormProps {
  callbackUrl?: string;
  providers?: PublicProviderInfo[];
  oauthError?: string;
}

export function LoginForm({
  callbackUrl,
  providers = [],
  oauthError,
}: LoginFormProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { pushToast } = useToast();
  const [login, { isLoading }] = useLoginMutation();
  const [values, setValues] = useState({ email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const oauthErrorMessage = getOAuthErrorMessage(oauthError);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsed = loginSchema.safeParse(values);

    if (!parsed.success) {
      setFieldErrors(zodFieldErrorMap(parsed.error));
      return;
    }

    setFieldErrors({});

    try {
      const response = await login(parsed.data).unwrap();

      dispatch(sessionLoaded(response.user));
      dispatch(setPendingVerificationEmail(null));
      pushToast({
        variant: "success",
        title: "Signed in",
        description: `Welcome back, ${response.user.name}.`,
      });

      router.push(callbackUrl ?? "/dashboard");
      router.refresh();
    } catch (error) {
      const apiError = asApiError(error);

      if (apiError.code === "EMAIL_NOT_VERIFIED") {
        dispatch(setPendingVerificationEmail(values.email));
        pushToast({
          variant: "info",
          title: "Verify your email",
          description: apiError.message,
        });
        router.push(`/verify-email?email=${encodeURIComponent(values.email)}`);
        return;
      }

      setFormError(apiError.message);
      setFieldErrors(toFieldErrorMap(apiError.fieldErrors));
    }
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
      {oauthErrorMessage ? <Alert variant="error">{oauthErrorMessage}</Alert> : null}

      {formError ? <Alert variant="error">{formError}</Alert> : null}

      <Field id="email" label="Email address" error={fieldErrors.email}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={values.email}
          invalid={Boolean(fieldErrors.email)}
          aria-describedby={fieldErrors.email ? "email-error" : undefined}
          onChange={(event) =>
            setValues((current) => ({ ...current, email: event.target.value }))
          }
        />
      </Field>

      <PasswordField
        id="password"
        label="Password"
        autoComplete="current-password"
        placeholder="Your password"
        value={values.password}
        invalid={Boolean(fieldErrors.password)}
        error={fieldErrors.password}
        onChange={(event) =>
          setValues((current) => ({ ...current, password: event.target.value }))
        }
      />

      <Button type="submit" size="lg" isLoading={isLoading} disabled={isLoading}>
        {isLoading ? "Signing in..." : "Sign in"}
      </Button>

      {providers.length > 0 ? (
        <SocialAuthButtons
          providers={providers}
          origin="login"
          disabled={isLoading}
        />
      ) : null}

      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        Need an account?{" "}
        <Link
          href="/signup"
          className="font-medium text-zinc-900 underline underline-offset-4 hover:no-underline dark:text-zinc-100"
        >
          Create one
        </Link>
      </p>
    </form>
  );
}
