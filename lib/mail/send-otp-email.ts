import "server-only";

import nodemailer from "nodemailer";
import { getServerEnv } from "@/lib/env";

export interface OtpEmailInput {
  to: string;
  name: string;
  code: string;
}

export interface OtpEmailResult {
  delivered: boolean;
  previewCode?: string;
}

function buildTransport() {
  const env = getServerEnv();

  if (!env.isMailTransportConfigured) {
    return null;
  }

  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } : undefined,
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderOtpEmail(input: { name: string; code: string }): string {
  return `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:24px;background:#f4f4f5;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#18181b;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:16px;padding:32px;border:1px solid #e4e4e7;">
            <tr>
              <td style="font-size:18px;font-weight:600;">Verify your email</td>
            </tr>
            <tr>
              <td style="padding-top:12px;font-size:14px;line-height:20px;color:#3f3f46;">
                Hi ${escapeHtml(input.name)}, use the verification code below to finish setting up your SaadAgent account. It expires in 5 minutes.
              </td>
            </tr>
            <tr>
              <td style="padding:24px 0;">
                <div style="font-size:34px;font-weight:700;letter-spacing:10px;text-align:center;background:#f4f4f5;border-radius:12px;padding:18px;">${escapeHtml(input.code)}</div>
              </td>
            </tr>
            <tr>
              <td style="font-size:12px;line-height:18px;color:#71717a;">
                If you did not create this account you can safely ignore this email.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function sendOtpEmail(input: OtpEmailInput): Promise<OtpEmailResult> {
  const env = getServerEnv();
  const transport = buildTransport();

  if (!transport) {
    console.info(`[mail] SMTP is not configured. OTP for ${input.to}: ${input.code}`);

    return env.isProduction
      ? { delivered: false }
      : { delivered: false, previewCode: input.code };
  }

  await transport.sendMail({
    from: env.SMTP_FROM,
    to: input.to,
    subject: "Your SaadAgent verification code",
    text: `Your verification code is ${input.code}. It expires in 5 minutes.`,
    html: renderOtpEmail(input),
  });

  return { delivered: true };
}
