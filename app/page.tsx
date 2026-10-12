import Link from "next/link";
import { Button } from "@/components/ui/button";
import { peekAuthenticatedUser } from "@/lib/auth/session";

export default async function Home() {
  const user = await peekAuthenticatedUser();

  return (
    <main className="flex w-full flex-1 items-center justify-center px-4 py-16">
      <div className="flex w-full max-w-2xl flex-col gap-10">
        <section className="flex flex-col gap-4">
          <p className="text-sm font-medium uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
            SaadAgent
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
            Email and password authentication with OTP verification
          </h1>
          <p className="text-base leading-7 text-zinc-600 dark:text-zinc-400">
            Signup, hashed passwords, single-use email codes, revocable HTTP-only
            sessions, rate limiting, and protected routes wired through Redux Toolkit
            and RTK Query.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {user?.isEmailVerified ? (
              <>
                <Link href="/dashboard">
                  <Button size="lg">Go to dashboard</Button>
                </Link>
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  Signed in as {user.email}
                </span>
              </>
            ) : (
              <>
                <Link href="/signup">
                  <Button size="lg">Create an account</Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="secondary">
                    Sign in
                  </Button>
                </Link>
              </>
            )}
            <Link
              href="/store-demo"
              className="text-sm font-medium text-zinc-600 underline underline-offset-4 hover:no-underline dark:text-zinc-400"
            >
              Redux store demo
            </Link>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          {[
            {
              title: "Hashed passwords",
              body: "bcrypt with a configurable cost, never stored or logged in plain text.",
            },
            {
              title: "One-time codes",
              body: "6-digit OTPs hashed with HMAC, 5-minute expiry, 60-second resend cooldown.",
            },
            {
              title: "Revocable sessions",
              body: "Opaque tokens hashed at rest, delivered in HTTP-only, SameSite cookies.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="flex flex-col gap-2 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
            >
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {item.title}
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">{item.body}</p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
