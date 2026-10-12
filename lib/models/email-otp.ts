import "server-only";

import mongoose, { Schema } from "mongoose";
import type { Model } from "mongoose";

export interface EmailOtpDocument {
  email: string;
  codeHash: string;
  attempts: number;
  expiresAt: Date;
  lastSentAt: Date;
  consumedAt?: Date;
}

const emailOtpSchema = new Schema<EmailOtpDocument>(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    codeHash: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
    lastSentAt: { type: Date, required: true },
    consumedAt: { type: Date },
  },
  { timestamps: true, versionKey: false },
);

emailOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type EmailOtpModelType = Model<EmailOtpDocument>;

export const EmailOtpModel =
  (mongoose.models.EmailOtp as EmailOtpModelType | undefined) ??
  mongoose.model<EmailOtpDocument>("EmailOtp", emailOtpSchema);
