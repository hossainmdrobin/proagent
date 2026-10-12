"use client";

import { useState } from "react";
import type { InputHTMLAttributes } from "react";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";

export interface PasswordFieldProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  id: string;
  label: string;
  error?: string;
  invalid?: boolean;
  hint?: React.ReactNode;
}

export function PasswordField({
  id,
  label,
  error,
  hint,
  className,
  ...props
}: PasswordFieldProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <Field id={id} label={label} error={error} hint={hint}>
      <div className="relative">
        <Input
          id={id}
          type={isVisible ? "text" : "password"}
          invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn("pr-16", className)}
          {...props}
        />
        <button
          type="button"
          onClick={() => setIsVisible((current) => !current)}
          aria-label={isVisible ? "Hide password" : "Show password"}
          aria-pressed={isVisible}
          className="absolute inset-y-0 right-0 flex w-14 items-center justify-center rounded-r-lg text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          {isVisible ? "Hide" : "Show"}
        </button>
      </div>
    </Field>
  );
}
