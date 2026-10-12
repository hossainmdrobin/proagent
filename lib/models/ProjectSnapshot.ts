
import "server-only";
import mongoose, { Schema, Types } from "mongoose";

export interface ProjectSnapshotRecord {
  projectId: Types.ObjectId;
  version: number;
  status: "writing" | "complete";
  fileCount: number;
  totalBytes: number;
}

const ProjectSnapshotSchema =
  new Schema<ProjectSnapshotRecord>(
    {
      projectId: {
        type: Schema.Types.ObjectId,
        required: true,
        index: true,
      },
      version: {
        type: Number,
        required: true,
        min: 1,
      },
      status: {
        type: String,
        enum: ["writing", "complete"],
        default: "writing",
        required: true,
      },
      fileCount: {
        type: Number,
        required: true,
        min: 0,
      },
      totalBytes: {
        type: Number,
        required: true,
        min: 0,
      },
    },
    { timestamps: true },
  );

ProjectSnapshotSchema.index(
  { projectId: 1, version: 1 },
  { unique: true },
);

export const ProjectSnapshot =
  mongoose.models.ProjectSnapshot ??
  mongoose.model<ProjectSnapshotRecord>(
    "ProjectSnapshot",
    ProjectSnapshotSchema,
  );
