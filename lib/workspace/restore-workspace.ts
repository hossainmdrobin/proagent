
import "server-only";

import mongoose from "mongoose";
import { Project } from "@/lib/models/Project";
import { ProjectFile } from "@/lib/models/ProjectFile";
import { ProjectSnapshot } from "@/lib/models/ProjectSnapshot";
import { connectToDatabase } from "../db";

export async function restoreWorkspace({
  projectId,
  ownerId,
  version,
}: {
  projectId: string;
  ownerId: string;
  version?: number;
}) {
  await connectToDatabase();

  if (
    !mongoose.isValidObjectId(projectId) ||
    !mongoose.isValidObjectId(ownerId)
  ) {
    throw new Error("Invalid project or owner ID");
  }

  const project = await Project.findOne({
    _id: projectId,
    ownerId,
  }).lean();

  if (!project) {
    throw new Error("Project not found");
  }

  const snapshot =
    version === undefined
      ? project.latestSnapshotId
        ? await ProjectSnapshot.findOne({
            _id: project.latestSnapshotId,
            projectId: project._id,
            status: "complete",
          }).lean()
        : null
      : await ProjectSnapshot.findOne({
          projectId: project._id,
          version,
          status: "complete",
        }).lean();

  if (!snapshot) {
    if (project.version === 0 && version === undefined) {
      return {
        projectId: project._id.toString(),
        version: 0,
        files: [],
      };
    }

    throw new Error("Snapshot not found");
  }

  const documents = await ProjectFile.find({
    projectId: project._id,
    snapshotId: snapshot._id,
  })
    .select({ _id: 0, path: 1, content: 1 })
    .sort({ path: 1 })
    .lean();

  if (documents.length !== snapshot.fileCount) {
    throw new Error("Snapshot integrity check failed");
  }

  return {
    projectId: project._id.toString(),
    snapshotId: snapshot._id.toString(),
    version: snapshot.version,
    files: documents.map((file) => ({
      path: file.path,
      content: file.content,
    })),
  };
}
