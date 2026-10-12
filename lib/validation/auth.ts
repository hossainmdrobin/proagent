import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email({ error: "Enter a valid email address." }));

export const passwordSchema = z
  .string()
  .min(8, { error: "Use at least 8 characters." })
  .max(128, { error: "Use at most 128 characters." })
  .regex(/[a-zA-Z]/, { error: "Include at least one letter." })
  .regex(/[0-9]/, { error: "Include at least one number." });

export const nameSchema = z
  .string()
  .trim()
  .min(2, { error: "Name must be at least 2 characters." })
  .max(80, { error: "Name must be at most 80 characters." });

export const otpCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, { error: "Enter the 6-digit code from your email." });

export const signupSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const signupFormSchema = signupSchema
  .extend({ confirmPassword: z.string() })
  .refine((values) => values.password === values.confirmPassword, {
    error: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { error: "Password is required." }).max(128),
});

export const verifyOtpSchema = z.object({
  code: otpCodeSchema,
});

export const PASSWORD_REQUIREMENTS = [
  "At least 8 characters",
  "At least one letter",
  "At least one number",
] as const;
