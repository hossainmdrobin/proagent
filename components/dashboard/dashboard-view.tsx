"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/providers/toast-provider";
import { useLogoutMutation } from "@/store/features/auth-api";
import type { PublicUser } from "@/store/features/auth-api";
import {
  clearSession,
  selectAuthStatus,
  selectIsInitialized,
} from "@/store/features/auth-slice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import type { OAuthProviderId } from "@/types/oauth";

const PROVIDER_LABELS: Record<OAuthProviderId, string> = {
  google: "Google",
  facebook: "Facebook",
  github: "GitHub",
};

export interface DashboardViewProps {
  user: PublicUser;
}

export function DashboardView({ user }: DashboardViewProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { pushToast } = useToast();
  const [logout, { isLoading }] = useLogoutMutation();
  const status = useAppSelector(selectAuthStatus);
  const isInitialized = useAppSelector(selectIsInitialized);

  useEffect(() => {
    if (isInitialized && status === "unauthenticated") {
      router.replace("/login");
    }
  }, [isInitialized, router, status]);

  async function handleLogout() {
    try {
      await logout().unwrap();
      dispatch(clearSession());
      pushToast({ variant: "success", title: "Signed out" });
      router.push("/login");
      router.refresh();
    } catch {
      pushToast({
        variant: "error",
        title: "Could not sign out",
        description: "Please try again.",
      });
    }
  }

  const joinedOn = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "Unknown";

  return (
    <div className="flex w-full max-w-3xl flex-col gap-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Signed in as</p>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {user.name}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-sm font-medium text-zinc-600 underline underline-offset-4 hover:no-underline dark:text-zinc-400"
          >
            Home
          </Link>
          <Button variant="secondary" onClick={() => void handleLogout()} isLoading={isLoading}>
            {isLoading ? "Signing out..." : "Sign out"}
          </Button>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Name
              </dt>
              <dd className="text-sm text-zinc-900 dark:text-zinc-100">{user.name}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Email
              </dt>
              <dd className="text-sm text-zinc-900 dark:text-zinc-100">{user.email}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Verification
              </dt>
              <dd>
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Verified
                </span>
              </dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Member since
              </dt>
              <dd className="text-sm text-zinc-900 dark:text-zinc-100">{joinedOn}</dd>
            </div>
            <div className="flex flex-col gap-1">
              <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Password
              </dt>
              <dd className="text-sm text-zinc-900 dark:text-zinc-100">
                {user.hasPassword ? "Set" : "Not set (provider account only)"}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Connected accounts</CardTitle>
        </CardHeader>
        <CardContent>
          {user.linkedProviders.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {user.linkedProviders.map((provider) => (
                <li
                  key={provider}
                  className="inline-flex items-center rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
                >
                  {PROVIDER_LABELS[provider]}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              No providers linked yet. This account signs in with email and password.
            </p>
          )}
        </CardContent>
      </Card>

      <section className="grid gap-4 sm:grid-cols-2">
        {[
          {
            title: "Session protected",
            body: "Your session lives in an HTTP-only cookie backed by a hashed, revocable server record.",
          },
          {
            title: "Email confirmed",
            body: "Your address was verified with a single-use, 5-minute OTP hashed before storage.",
          },
        ].map((item) => (
          <Card key={item.title}>
            <CardHeader>
              <CardTitle className="text-base">{item.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">{item.body}</p>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
