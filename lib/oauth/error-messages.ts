const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  cancelled: "Sign-in was cancelled. You can try again whenever you are ready.",
  provider_error: "The provider could not complete the sign-in. Please try again.",
  invalid_state:
    "That sign-in request expired or was rejected for security reasons. Please try again.",
  exchange_failed: "We could not finish signing you in. Please try again.",
  email_required:
    "This provider did not share a usable email address. Add a verified email to the provider account and try again.",
  email_in_use:
    "That email already belongs to an account, but the provider did not confirm it. Verify the email with your verification code first, then sign in with this provider.",
  not_configured: "This sign-in method is not configured on this server.",
  unexpected: "Something went wrong while signing you in. Please try again.",
};

export function getOAuthErrorMessage(code: string | undefined): string | null {
  if (!code) {
    return null;
  }

  return (
    OAUTH_ERROR_MESSAGES[code] ??
    "Something went wrong while signing you in. Please try again."
  );
}