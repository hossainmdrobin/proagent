"use client";

import { useMemo, useState } from "react";
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
import { cn } from "@/lib/cn";
import { getOAuthErrorMessage } from "@/lib/oauth/error-messages";
import { PASSWORD_REQUIREMENTS, signupFormSchema } from "@/lib/validation/auth";
import { useSignupMutation } from "@/store/features/auth-api";
import { setPendingVerificationEmail } from "@/store/features/auth-slice";
import { useAppDispatch } from "@/store/hooks";
import type { PublicProviderInfo } from "@/types/oauth";

const initialValues = { name: "", email: "", password: "", confirmPassword: "" };

export interface SignupFormProps {
  providers?: PublicProviderInfo[];
  oauthError?: string;
}

export function SignupForm({ providers = [], oauthError }: SignupFormProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { pushToast } = useToast();
  const [signup, { isLoading }] = useSignupMutation();
  const [values, setValues] = useState(initialValues);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const oauthErrorMessage = getOAuthErrorMessage(oauthError);

  const metRequirements = useMemo(
    () => [
      values.password.length >= 8,
      /[a-zA-Z]/.test(values.password),
      /[0-9]/.test(values.password),
    ],
    [values.password],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const parsed = signupFormSchema.safeParse(values);

    if (!parsed.success) {
      setFieldErrors(zodFieldErrorMap(parsed.error));
      return;
    }

    setFieldErrors({});

    try {
      const response = await signup({
        name: parsed.data.name,
        email: parsed.data.email,
        password: parsed.data.password,
      }).unwrap();

      dispatch(setPendingVerificationEmail(response.email));
      pushToast({
        variant: "success",
        title: "Account created",
        description: "Check your inbox for the 6-digit verification code.",
      });

      router.push(`/verify-email?email=${encodeURIComponent(response.email)}`);
    } catch (error) {
      const apiError = asApiError(error);
      setFormError(apiError.message);
      setFieldErrors(toFieldErrorMap(apiError.fieldErrors));
    }
  }

  function updateValue(field: keyof typeof initialValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  return (
    <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
      {oauthErrorMessage ? <Alert variant="error">{oauthErrorMessage}</Alert> : null}

      {formError ? <Alert variant="error">{formError}</Alert> : null}

      <Field id="name" label="Full name" error={fieldErrors.name}>
        <Input
          id="name"
          name="name"
          autoComplete="name"
          placeholder="Ada Lovelace"
          value={values.name}
          invalid={Boolean(fieldErrors.name)}
          onChange={(event) => updateValue("name", event.target.value)}
        />
      </Field>

      <Field id="email" label="Email address" error={fieldErrors.email}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={values.email}
          invalid={Boolean(fieldErrors.email)}
          onChange={(event) => updateValue("email", event.target.value)}
        />
      </Field>

      <PasswordField
        id="password"
        label="Password"
        autoComplete="new-password"
        placeholder="Create a strong password"
        value={values.password}
        invalid={Boolean(fieldErrors.password)}
        error={fieldErrors.password}
        onChange={(event) => updateValue("password", event.target.value)}
      />

      <ul className="flex flex-col gap-1">
        {PASSWORD_REQUIREMENTS.map((requirement, index) => (
          <li
            key={requirement}
            className={cn(
              "text-xs",
              metRequirements[index]
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-zinc-500 dark:text-zinc-400",
            )}
          >
            {metRequirements[index] ? "✓" : "•"} {requirement}
          </li>
        ))}
      </ul>

      <PasswordField
        id="confirmPassword"
        label="Confirm password"
        autoComplete="new-password"
        placeholder="Repeat your password"
        value={values.confirmPassword}
        invalid={Boolean(fieldErrors.confirmPassword)}
        error={fieldErrors.confirmPassword}
        onChange={(event) => updateValue("confirmPassword", event.target.value)}
      />

      <Button type="submit" size="lg" isLoading={isLoading} disabled={isLoading}>
        {isLoading ? "Creating account..." : "Create account"}
      </Button>

      {providers.length > 0 ? (
        <SocialAuthButtons
          providers={providers}
          origin="signup"
          disabled={isLoading}
        />
      ) : null}

      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-zinc-900 underline underline-offset-4 hover:no-underline dark:text-zinc-100"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
