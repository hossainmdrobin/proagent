import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { peekAuthenticatedUser } from "@/lib/auth/session";
import { getPublicProviderInfo } from "@/lib/oauth/providers";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; oauthError?: string }>;
}) {
  const user = await peekAuthenticatedUser();

  if (user?.isEmailVerified) {
    redirect("/dashboard");
  }

  const { callbackUrl, oauthError } = await searchParams;
  const safeCallbackUrl =
    typeof callbackUrl === "string" &&
    callbackUrl.startsWith("/") &&
    !callbackUrl.startsWith("//")
      ? callbackUrl
      : undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>
          Sign in with your email address and password, or continue with a provider.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm
          callbackUrl={safeCallbackUrl}
          providers={getPublicProviderInfo()}
          oauthError={oauthError}
        />
      </CardContent>
    </Card>
  );
}