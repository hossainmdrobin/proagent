
import "server-only";
import mongoose, { Schema, Types } from "mongoose";

export interface ProjectRecord {
  _id?: Types.ObjectId;
  ownerId: Types.ObjectId;
  name: string;
  framework: string;
  latestSnapshotId: Types.ObjectId | null;
  version: number;
  previewCommandId?: string | null;
  previewUrl?: string | null;
  previewStatus?: "stopped" | "starting" | "ready" | "failed";
}

const ProjectSchema = new Schema<ProjectRecord>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    framework: {
      type: String,
      default: "react-vite",
      required: true,
    },
    latestSnapshotId: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    version: {
      type: Number,
      default: 0,
      min: 0,
    },
    previewCommandId: {
      type: String,
      default: null,
    },
    previewUrl: {
      type: String,
      default: null,
    },
    previewStatus: {
      type: String,
      enum: ["stopped", "starting", "ready", "failed"],
      default: "stopped",
    },
  },
  { timestamps: true },
);

ProjectSchema.index({ ownerId: 1, updatedAt: -1 });

export const Project =
  mongoose.models.Project ??
  mongoose.model<ProjectRecord>("Project", ProjectSchema);
