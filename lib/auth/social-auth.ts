import "server-only";

import { connectToDatabase } from "@/lib/db";
import { isDuplicateKeyError } from "@/lib/api-response";
import { UserModel } from "@/lib/models/user";
import type { User } from "@/lib/models/user";
import type { OAuthProfile } from "@/lib/oauth/oauth";
import type { OAuthProviderId } from "@/types/oauth";

export type SocialAuthErrorCode =
  | "provider_error"
  | "email_required"
  | "email_in_use";

export type SocialAuthOutcome =
  | { status: "authenticated"; user: User }
  | { status: "pending_verification"; user: User }
  | { status: "error"; code: SocialAuthErrorCode; message: string };

function describeEmailRequired(providerLabel: string): string {
  return providerLabel === "GitHub"
    ? "Your GitHub account does not expose a usable email address. Add a verified email to GitHub and try again."
    : `${providerLabel} did not share an email address with this application. Add an email to your ${providerLabel} account and try again.`;
}

function describeEmailInUse(providerLabel: string): string {
  return `${providerLabel} did not confirm that email address, so it cannot be linked to an existing account. Verify that email with your verification code first, then sign in with ${providerLabel}.`;
}

function deriveName(profile: OAuthProfile, email: string): string {
  const name = profile.name?.trim();

  if (name) {
    return name.slice(0, 80);
  }

  return email.split("@")[0].slice(0, 80);
}

function findLinkedProvider(user: User, provider: OAuthProviderId, accountId: string) {
  return user.providers.find(
    (entry) => entry.provider === provider && entry.providerAccountId === accountId,
  );
}

function attachProvider(user: User, provider: OAuthProviderId, profile: OAuthProfile): void {
  user.providers ??= [];
  user.providers.push({
    provider,
    providerAccountId: profile.providerAccountId,
    providerEmail: profile.email ?? undefined,
    providerName: profile.name ?? undefined,
    providerAvatar: profile.avatarUrl ?? undefined,
    linkedAt: new Date(),
  });
}

function syncProviderProfile(
  user: User,
  provider: OAuthProviderId,
  profile: OAuthProfile,
): void {
  const linked = findLinkedProvider(user, provider, profile.providerAccountId);

  if (!linked) {
    return;
  }

  if (profile.email) {
    linked.providerEmail = profile.email;
  }

  if (profile.name) {
    linked.providerName = profile.name;
  }

  if (profile.avatarUrl) {
    linked.providerAvatar = profile.avatarUrl;
  }
}

async function completeSignIn(user: User): Promise<SocialAuthOutcome> {
  user.lastLoginAt = new Date();
  await user.save();

  return user.isEmailVerified
    ? { status: "authenticated", user }
    : { status: "pending_verification", user };
}

export async function authenticateWithProvider(input: {
  provider: OAuthProviderId;
  providerLabel: string;
  profile: OAuthProfile;
}): Promise<SocialAuthOutcome> {
  const { provider, providerLabel, profile } = input;

  if (!profile.providerAccountId) {
    return {
      status: "error",
      code: "provider_error",
      message: `${providerLabel} did not return an account identifier.`,
    };
  }

  const email = profile.email;

  if (!email) {
    return {
      status: "error",
      code: "email_required",
      message: describeEmailRequired(providerLabel),
    };
  }

  await connectToDatabase();

  const linkedUser = await UserModel.findOne({
    providers: {
      $elemMatch: { provider, providerAccountId: profile.providerAccountId },
    },
  });

  if (linkedUser) {
    syncProviderProfile(linkedUser, provider, profile);
    return completeSignIn(linkedUser);
  }

  const existingUser = await UserModel.findOne({ email });

  if (existingUser) {
    if (!profile.emailVerified) {
      return {
        status: "error",
        code: "email_in_use",
        message: describeEmailInUse(providerLabel),
      };
    }

    if (!existingUser.isEmailVerified) {
      existingUser.isEmailVerified = true;
      existingUser.emailVerifiedAt = new Date();
    }

    attachProvider(existingUser, provider, profile);
    return completeSignIn(existingUser);
  }

  try {
    const createdUser = await UserModel.create({
      name: deriveName(profile, email),
      email,
      isEmailVerified: profile.emailVerified,
      emailVerifiedAt: profile.emailVerified ? new Date() : undefined,
      providers: [
        {
          provider,
          providerAccountId: profile.providerAccountId,
          providerEmail: email,
          providerName: profile.name ?? undefined,
          providerAvatar: profile.avatarUrl ?? undefined,
          linkedAt: new Date(),
        },
      ],
    });

    return completeSignIn(createdUser);
  } catch (error) {
    if (!isDuplicateKeyError(error)) {
      throw error;
    }

    const racedUser = await UserModel.findOne({ email });

    if (!racedUser || !profile.emailVerified) {
      throw error;
    }

    if (!racedUser.isEmailVerified) {
      racedUser.isEmailVerified = true;
      racedUser.emailVerifiedAt = new Date();
    }

    attachProvider(racedUser, provider, profile);
    return completeSignIn(racedUser);
  }
}