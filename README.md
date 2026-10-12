# SaadAgent

Next.js 16 (App Router) + TypeScript application with a complete email/password
authentication system: signup, one-time email verification (OTP), login, logout,
protected routes, and Redux Toolkit + RTK Query state management on top of MongoDB.
Google, Facebook, and GitHub sign-in are available on top of the same session,
verification, and user model.

## Stack

| Concern     | Choice                                              |
| ----------- | --------------------------------------------------- |
| Framework   | Next.js 16 App Router, React 19, TypeScript          |
| State       | Redux Toolkit + RTK Query                            |
| Database    | MongoDB via Mongoose                                |
| Validation  | Zod (shared between client forms and API routes)     |
| Email       | Nodemailer (SMTP, with a console fallback in dev)    |
| Passwords   | bcrypt                                              |
| Social auth | OAuth 2.0 authorization code + PKCE (no extra SDK)   |
| Styling     | Tailwind CSS 4                                      |

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create your environment file:

   ```bash
   cp .env.example .env.local
   ```

3. Generate a secret for `AUTH_SECRET`:

   ```bash
   openssl rand -base64 32
   ```

   Paste the result into `AUTH_SECRET` in `.env.local`. In development a fallback
   secret is used when it is missing (with a warning), but production refuses to
   start without one.

4. Start MongoDB locally, e.g.:

   ```bash
   docker run -d --name saadagent-mongo -p 27017:27017 mongo:7
   ```

   Then point `MONGODB_URI` at it: `mongodb://127.0.0.1:27017/saadagent`.

5. Run the app:

   ```bash
   npm run dev
   ```

6. Open <http://localhost:3000>, create an account at `/signup`, and use the
   verification code that is emailed to you.

### Social sign-in

Google, Facebook, and GitHub sign-in work without any additional dependency. Each
provider is independent and optional:

1. Create an OAuth app with the provider and copy the client id and secret into
   `.env.local`:

   | Provider | Console                                        | Env vars                            |
   | -------- | ---------------------------------------------- | ----------------------------------- |
   | Google   | Google Cloud Console → APIs & Services → Credentials → OAuth client ID | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` |
   | Facebook | Meta for Developers → Facebook Login → Settings → Client ID/Secret     | `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET` |
   | GitHub   | Settings → Developer settings → OAuth Apps → Generate a new client secret | `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` |

2. Register the redirect URI for the app. The callback path is fixed, and the host
   comes from `APP_URL`:

   ```text
   {APP_URL}/api/auth/oauth/google/callback
   {APP_URL}/api/auth/oauth/facebook/callback
   {APP_URL}/api/auth/oauth/github/callback
   ```

3. Add the scopes the app requests: `openid email profile` (Google), `email
   public_profile` (Facebook), and `read:user user:email` (GitHub).

A provider button is shown only once both its client id and secret are present, so
an unconfigured provider disappears from the screens and its endpoint answers with
`not_configured`. Endpoint overrides (`GOOGLE_AUTHORIZE_URL`, `GITHUB_USER_EMAILS_URL`,
and friends) exist in `.env.example` for tests and self-hosted proxies.

Google and GitHub report whether the email they share is verified; Facebook does
not, so Facebook sign-in always completes through the normal OTP verification step.
An account is only linked to an existing password account by email when the provider
confirms that email, which prevents a takeover through an unverified address.

### Email delivery

If `SMTP_HOST` is set, OTPs are sent through Nodemailer using the `SMTP_*` values.
If it is not set, development mode logs the code to the server console and returns
it in the API response as `devOtp` so the flow can be exercised without a mail
provider. In production the code is never returned in a response.

### Environment variables

| Variable              | Required | Default                          | Purpose                                              |
| --------------------- | -------- | -------------------------------- | ---------------------------------------------------- |
| `MONGODB_URI`         | yes      | —                                | Mongoose connection string                            |
| `AUTH_SECRET`         | prod yes | dev fallback                     | Signs verification cookies, HMAC-hashes OTP codes     |
| `BCRYPT_ROUNDS`       | no       | `12`                             | Password hashing cost (10-15)                         |
| `APP_URL`             | no       | `http://localhost:3000`          | Absolute app URL                                      |
| `NEXT_PUBLIC_API_URL` | no       | `/api`                           | RTK Query base URL                                    |
| `SMTP_HOST`           | no       | —                                | SMTP server; unset means console fallback in dev     |
| `SMTP_PORT`           | no       | `587`                            | SMTP port                                             |
| `SMTP_SECURE`         | no       | `false`                          | Use TLS on the SMTP connection (port 465)             |
| `SMTP_USER`/`PASSWORD`| no       | —                                | SMTP credentials                                      |
| `SMTP_FROM`           | no       | `SaadAgent <no-reply@saadagent.dev>` | Envelope sender address                           |
| `{PROVIDER}_CLIENT_ID`/`_CLIENT_SECRET` | no | —                    | OAuth client credentials; both required to enable a provider |
| `{PROVIDER}_AUTHORIZE_URL`/`_TOKEN_URL`/`_USERINFO_URL` | no | provider default | Endpoint overrides for tests and proxies          |
| `GITHUB_USER_EMAILS_URL` | no     | `https://api.github.com/user/emails` | Verified-email lookup for GitHub                  |

`{PROVIDER}` is `GOOGLE`, `FACEBOOK`, or `GITHUB`. See `.env.example` for the full
list.

## Project structure

```
app/
  (auth)/layout.tsx            Shared shell for the auth screens
  (auth)/login/page.tsx        Login screen (server component)
  (auth)/signup/page.tsx       Signup screen (server component)
  (auth)/verify-email/page.tsx OTP verification screen (server component)
  dashboard/page.tsx           Protected dashboard (server component)
  api/auth/signup/route.ts     POST create account + send OTP
  api/auth/login/route.ts      POST authenticate + create session
  api/auth/logout/route.ts     POST revoke session + clear cookie
  api/auth/me/route.ts         GET current user from the session
  api/auth/verify-otp/route.ts POST verify code + create session
  api/auth/resend-otp/route.ts POST issue a new code after the cooldown
  api/auth/otp-status/route.ts GET resend cooldown / verification state
  api/auth/oauth/[provider]/route.ts            GET start social sign-in
  api/auth/oauth/[provider]/callback/route.ts    GET handle the provider callback
components/
  auth/                        Login, signup, OTP, password and countdown widgets
  auth/social-auth-buttons.tsx Provider buttons and inline OAuth error notices
  dashboard/dashboard-view.tsx Client dashboard with sign out
  providers/toast-provider.tsx Toast notifications
  ui/                          Button, input, field, card, alert, spinner
lib/
  api-response.ts              Response envelope, ApiError, route error handling
  api-client.ts                Client helpers for typed API errors
  auth/password.ts             bcrypt hashing and comparison
  auth/otp.ts                  OTP generation, HMAC hashing, verification
  auth/service.ts              Signup / login / verification workflows
  auth/session.ts              Session creation, reads, revocation, cookies
  auth/social-auth.ts          Provider identity resolution, linking, sign-in
  auth/tokens.ts               Secure random tokens, hashing, HMAC signing
  constants.ts                 Cookie names and auth limits
  db.ts                        Cached Mongoose connection
  env.ts                       Validated server environment
  models/                      Mongoose models: user, session, email-otp
  oauth/oauth.ts               Authorization URL, code exchange, profile mapping
  oauth/providers.ts           Provider credentials, scopes, endpoints
  oauth/state.ts               PKCE verifier/challenge and signed state cookie
  oauth/error-messages.ts      `oauthError` code to user-facing copy
  rate-limit.ts                Sliding window rate limiter
  validation/auth.ts           Zod schemas shared by forms and API routes
proxy.ts                       Optimistic route redirects (Next.js Proxy)
store/
  base-api.ts                  RTK Query base API with response unwrapping
  features/auth-api.ts         Auth endpoints
  features/auth-slice.ts       Current user, status, initialization
types/api.ts                   API envelope and typed error shapes
types/oauth.ts                 Provider ids and public provider info
```

## Flow

1. **Signup** (`POST /api/auth/signup`) validates the payload with Zod, rejects
   duplicate emails, hashes the password with bcrypt, creates the user, generates a
   6-digit code with `crypto.randomInt`, stores only its HMAC hash, emails it, and
   sets a short-lived signed `saad_verify` cookie. If the email cannot be sent the
   new account is rolled back so the user can retry cleanly.
2. **Verification** (`POST /api/auth/verify-otp`) reads the signed verification
   cookie, resolves the user server-side (the email is never trusted from the
   client), checks expiry and the 5-attempt limit, compares hashes in constant
   time, then deletes the code, marks the account verified, creates a session and
   clears the verification cookie.
3. **Resend** (`POST /api/auth/resend-otp`) is limited to once per 60 seconds per
   account; issuing a new code invalidates the previous one.
4. **Login** (`POST /api/auth/login`) verifies the password, refuses unverified
   accounts with `EMAIL_NOT_VERIFIED`, locks the account for 15 minutes after 5
   failed attempts, and creates a session on success.
5. **Logout** (`POST /api/auth/logout`) deletes the stored session and expires the
   cookie, so the token is revoked server-side rather than just cleared in the
   browser.
6. **Social sign-in** (`GET /api/auth/oauth/{provider}` then
   `GET /api/auth/oauth/{provider}/callback`) redirects to the provider with PKCE
   (`S256`) and a signed state. The callback exchanges the code, maps the provider
   profile, then resolves the user: an already-linked identity signs in, an
   unverified email claiming an existing account is refused, a verified email that
   matches an existing account links the provider to it, and a new address creates
   a password-less user. Accounts without a verified provider email are sent through
   the same OTP verification as a signup. The session cookie is unchanged, so
   `saad_session` is issued exactly as it is for a password login.

## Security notes

- Passwords are bcrypt hashes; the field is `select: false` and is never returned.
- Sessions are 32-byte random tokens. Only their SHA-256 hash is stored, so a
  database leak cannot be replayed as a session. Cookies are `HttpOnly`,
  `SameSite=Lax`, `Path=/`, `Secure` in production, and expire after 7 days.
  Sessions also expire server-side and are removed by a MongoDB TTL index.
- OTP codes are HMAC-SHA256 hashed with `AUTH_SECRET`, expire after 5 minutes, are
  limited to 5 attempts, can be requested once per minute, and are deleted on use.
- The verification cookie is HMAC signed and HttpOnly, so verification targets
  cannot be tampered with or enumerated from the browser.
- Every mutating route validates with Zod on the server, even though the forms
  validate on the client.
- Rate limits apply per IP and per email/account (signup 5/hour, login
  10/15 minutes, OTP verification 10/15 minutes, resend 5/hour) with
  `Retry-After` and `X-RateLimit-*` headers.
- Login responses are generic (`Email or password is incorrect`) to avoid account
  enumeration, and no tokens are ever written to `localStorage`.
- Social sign-in uses the authorization code flow with PKCE, so the client secret
  stays server-side and the code cannot be replayed without the stored verifier.
- The OAuth state payload is HMAC signed, stored in an HttpOnly cookie, limited to
  10 minutes, and checked against the returned `state` before any code is exchanged.
  The post-login destination is sanitized, so it cannot be used as an open redirect.
- A provider email only links to an existing account when the provider asserts it is
  verified. Facebook shares no such claim, so Facebook sign-in always requires email
  verification first.
- `providers.provider` + `providers.providerAccountId` carry a unique index, so one
  provider identity can never be attached to two accounts.

### Production checklist

- Set `AUTH_SECRET` (32+ characters) and `MONGODB_URI`.
- Configure SMTP; unset SMTP in production makes verification impossible.
- Register `{APP_URL}/api/auth/oauth/{provider}/callback` with every enabled
  provider, and keep `APP_URL` matching the public HTTPS origin.
- `proxy.ts` only performs optimistic cookie checks. The dashboard enforces access
  with `requireSession()` on the server, and every API route validates the session
  itself. Keep those server checks if you add routes.
- The rate limiter is in-memory and per process. Behind more than one instance,
  move `lib/rate-limit.ts` to a shared store such as Redis.
- Terminate TLS in front of the app so session cookies are only sent over HTTPS.
# proagent
