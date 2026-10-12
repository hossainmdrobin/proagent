export const SESSION_COOKIE_NAME = "saad_session";
export const VERIFICATION_COOKIE_NAME = "saad_verify";

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
export const VERIFICATION_MAX_AGE_SECONDS = 60 * 10;

export const OTP_LENGTH = 6;
export const OTP_EXPIRY_MS = 5 * 60 * 1000;
export const OTP_RESEND_COOLDOWN_SECONDS = 60;
export const OTP_MAX_ATTEMPTS = 5;

export const LOGIN_MAX_FAILED_ATTEMPTS = 5;
export const LOGIN_LOCK_DURATION_MS = 15 * 60 * 1000;

export const MINUTE = 60 * 1000;
export const HOUR = 60 * MINUTE;
