"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import type { OAuthProviderId, PublicProviderInfo } from "@/types/oauth";

export interface SocialAuthButtonsProps {
  providers: PublicProviderInfo[];
  origin: "login" | "signup";
  disabled?: boolean;
  className?: string;
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4">
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.4a5.5 5.5 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.6-5.1 3.6-8.8Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3a7.2 7.2 0 0 1-10.7-3.8h-4v3.1A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A11.5 11.5 0 0 0 12 0 12 12 0 0 0 1.3 6.6l4 3.1A7.2 7.2 0 0 1 12 4.8Z"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4">
      <path
        fill="#1877F2"
        d="M24 12a12 12 0 1 0-13.9 11.9v-8.4h-3V12h3V9.4c0-3 1.8-4.7 4.6-4.7 1.3 0 2.7.3 2.7.3v2.9h-1.5c-1.5 0-2 .9-2 1.9V12h3.3l-.5 3.5h-2.8v8.4A12 12 0 0 0 24 12Z"
      />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 fill-zinc-900 dark:fill-zinc-100">
      <path d="M12 .5a11.5 11.5 0 0 0-3.6 22.4c.6.1.8-.2.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.8.1-.8.1-.8 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0C16.7 4.4 17.7 4.7 17.7 4.7c.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .4.2.7.8.6A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  );
}

const ICONS: Record<OAuthProviderId, () => React.ReactElement> = {
  google: GoogleIcon,
  facebook: FacebookIcon,
  github: GitHubIcon,
};

export function SocialAuthButtons({
  providers,
  origin,
  disabled = false,
  className,
}: SocialAuthButtonsProps) {
  const [pendingProvider, setPendingProvider] = useState<OAuthProviderId | null>(null);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
        <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          or continue with
        </span>
        <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
      </div>

      {providers.map((provider) => {
        const Icon = ICONS[provider.id];
        const isPending = pendingProvider === provider.id;
        const isBlocked = disabled || pendingProvider !== null || !provider.configured;

        return (
          <a
            key={provider.id}
            href={`/api/auth/oauth/${provider.id}?from=${origin}`}
            aria-disabled={isBlocked}
            aria-busy={isPending}
            title={
              provider.configured
                ? `Continue with ${provider.label}`
                : `Set ${provider.id.toUpperCase()}_CLIENT_ID and ${provider.id.toUpperCase()}_CLIENT_SECRET to enable ${provider.label}`
            }
            onClick={(event) => {
              if (isBlocked) {
                event.preventDefault();
                return;
              }

              setPendingProvider(provider.id);
            }}
            className={cn(
              "inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-lg border border-zinc-300 bg-white text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800",
              isPending && "opacity-70",
            )}
          >
            <Icon />
            {isPending
              ? `Redirecting to ${provider.label}...`
              : `Continue with ${provider.label}`}
          </a>
        );
      })}
    </div>
  );
}