import { redirect } from "next/navigation";
import { SignupForm } from "@/components/auth/signup-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { peekAuthenticatedUser } from "@/lib/auth/session";
import { getPublicProviderInfo } from "@/lib/oauth/providers";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ oauthError?: string }>;
}) {
  const user = await peekAuthenticatedUser();

  if (user?.isEmailVerified) {
    redirect("/dashboard");
  }

  const { oauthError } = await searchParams;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
        <CardDescription>
          Sign up with your email and password, continue with a provider, or both.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SignupForm providers={getPublicProviderInfo()} oauthError={oauthError} />
      </CardContent>
    </Card>
  );
}