
import "server-only";
import mongoose, { Schema, Types } from "mongoose";

export interface ProjectFileRecord {
  projectId: Types.ObjectId;
  snapshotId: Types.ObjectId;
  path: string;
  content: string;
  sizeBytes: number;
}

const ProjectFileSchema = new Schema<ProjectFileRecord>(
  {
    projectId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    snapshotId: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    path: {
      type: String,
      required: true,
      maxlength: 500,
    },
    content: {
      type: String,
      required: true,
    },
    sizeBytes: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { timestamps: true },
);

ProjectFileSchema.index(
  { snapshotId: 1, path: 1 },
  { unique: true },
);

ProjectFileSchema.index({ projectId: 1, snapshotId: 1 });

export const ProjectFile =
  mongoose.models.ProjectFile ??
  mongoose.model<ProjectFileRecord>(
    "ProjectFile",
    ProjectFileSchema,
  );
