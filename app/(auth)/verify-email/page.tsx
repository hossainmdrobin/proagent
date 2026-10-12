import { VerifyOtpForm } from "@/components/auth/verify-otp-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { maskEmail } from "@/lib/format";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; devOtp?: string }>;
}) {
  const { email, devOtp } = await searchParams;
  const emailMasked =
    typeof email === "string" && email.includes("@")
      ? maskEmail(email.trim().toLowerCase())
      : null;
  const initialCode = typeof devOtp === "string" && /^\d{6}$/.test(devOtp) ? devOtp : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verify your email</CardTitle>
        <CardDescription>
          Enter the 6-digit code we emailed you. It can only be used once.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <VerifyOtpForm emailMasked={emailMasked} initialCode={initialCode} />
      </CardContent>
    </Card>
  );
}