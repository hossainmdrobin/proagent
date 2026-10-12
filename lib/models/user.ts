import "server-only";

import mongoose, { Schema } from "mongoose";
import type { HydratedDocument, Model } from "mongoose";
import type { OAuthProviderId } from "@/types/oauth";

export type UserRole = "user" | "admin";

export interface LinkedProvider {
  provider: OAuthProviderId;
  providerAccountId: string;
  providerEmail?: string;
  providerName?: string;
  providerAvatar?: string;
  linkedAt?: Date;
}

export interface UserDocument {
  name: string;
  email: string;
  passwordHash?: string;
  isEmailVerified: boolean;
  emailVerifiedAt?: Date;
  role: UserRole;
  providers: LinkedProvider[];
  failedLoginCount: number;
  lockedUntil?: Date;
  lastLoginAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const linkedProviderSchema = new Schema<LinkedProvider>(
  {
    provider: {
      type: String,
      enum: ["google", "facebook", "github"],
      required: true,
    },
    providerAccountId: { type: String, required: true },
    providerEmail: { type: String },
    providerName: { type: String },
    providerAvatar: { type: String },
    linkedAt: { type: Date, default: () => new Date() },
  },
  { _id: false },
);

const userSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, select: false },
    isEmailVerified: { type: Boolean, default: false },
    emailVerifiedAt: { type: Date },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    providers: { type: [linkedProviderSchema], default: [] },
    failedLoginCount: { type: Number, default: 0 },
    lockedUntil: { type: Date },
    lastLoginAt: { type: Date },
  },
  { timestamps: true, versionKey: false },
);

userSchema.index(
  { "providers.provider": 1, "providers.providerAccountId": 1 },
  { unique: true },
);

export type UserModelType = Model<UserDocument>;
export type User = HydratedDocument<UserDocument>;

export const UserModel =
  (mongoose.models.User as UserModelType | undefined) ??
  mongoose.model<UserDocument>("User", userSchema);
