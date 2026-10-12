import type { ReactNode } from "react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex w-full flex-1 items-center justify-center px-4 py-10 sm:py-16">
      <div className="flex w-full max-w-md flex-col gap-6">
        <Link
          href="/"
          className="self-center text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50"
        >
          SaadAgent
        </Link>
        {children}
        <p className="text-center text-xs text-zinc-500 dark:text-zinc-500">
          Password hashing with bcrypt, hashed one-time codes, and HTTP-only sessions.
        </p>
      </div>
    </main>
  );
}
