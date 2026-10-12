import "server-only";

import mongoose, { Schema } from "mongoose";
import type { Model, Types } from "mongoose";

export interface SessionDocument {
  userId: Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  revokedAt?: Date;
  userAgent?: string;
  ip?: string;
}

const sessionSchema = new Schema<SessionDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date },
    userAgent: { type: String },
    ip: { type: String },
  },
  { timestamps: true, versionKey: false },
);

sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type SessionModelType = Model<SessionDocument>;

export const SessionModel =
  (mongoose.models.Session as SessionModelType | undefined) ??
  mongoose.model<SessionDocument>("Session", sessionSchema);
