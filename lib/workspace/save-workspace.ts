
import "server-only";

import mongoose, { Types } from "mongoose";
import { Project } from "@/lib/models/Project";
import { ProjectFile } from "@/lib/models/ProjectFile";
import { ProjectSnapshot } from "@/lib/models/ProjectSnapshot";
import { connectToDatabase } from "../db";

const MAX_FILES = 500;
const MAX_FILE_BYTES = 512 * 1024;
const MAX_TOTAL_BYTES = 8 * 1024 * 1024;

export interface WorkspaceFile {
  path: string;
  content: string;
}

function validateFiles(files: WorkspaceFile[]) {
  if (files.length > MAX_FILES) {
    throw new Error("Snapshot contains too many files");
  }

  const seen = new Set<string>();
  let totalBytes = 0;

  for (const file of files) {
    const path = file.path.replace(/\\/g, "/");
    const parts = path.split("/");

    if (
      !path ||
      path.startsWith("/") ||
      path.includes("\0") ||
      parts.some((part) => !part || part === "." || part === "..")
    ) {
      throw new Error(`Invalid file path: ${file.path}`);
    }

    if (seen.has(path)) {
      throw new Error(`Duplicate file path: ${path}`);
    }

    seen.add(path);

    const bytes = Buffer.byteLength(file.content, "utf8");

    if (bytes > MAX_FILE_BYTES) {
      throw new Error(`File is too large: ${path}`);
    }

    totalBytes += bytes;
  }

  if (totalBytes > MAX_TOTAL_BYTES) {
    throw new Error("Snapshot exceeds the total size limit");
  }

  return {
    totalBytes,
    files: files.map((file) => ({
      path: file.path.replace(/\\/g, "/"),
      content: file.content,
      sizeBytes: Buffer.byteLength(file.content, "utf8"),
    })),
  };
}

export async function saveWorkspace({
  projectId,
  ownerId,
  expectedVersion,
  files,
}: {
  projectId: string;
  ownerId: string;
  expectedVersion: number;
  files: WorkspaceFile[];
}) {
  await connectToDatabase();

  if (
    !mongoose.isValidObjectId(projectId) ||
    !mongoose.isValidObjectId(ownerId)
  ) {
    throw new Error("Invalid project or owner ID");
  }

  if (
    !Number.isSafeInteger(expectedVersion) ||
    expectedVersion < 0
  ) {
    throw new Error("Invalid expected version");
  }

  const projectObjectId = new Types.ObjectId(projectId);
  const ownerObjectId = new Types.ObjectId(ownerId);
  const validated = validateFiles(files);

  const project = await Project.findOne({
    _id: projectObjectId,
    ownerId: ownerObjectId,
    version: expectedVersion,
  }).lean();

  if (!project) {
    throw new Error(
      "Project not found or version conflict",
    );
  }

  const nextVersion = expectedVersion + 1;
  const snapshot = await ProjectSnapshot.create({
    projectId: projectObjectId,
    version: nextVersion,
    status: "writing",
    fileCount: validated.files.length,
    totalBytes: validated.totalBytes,
  });

  try {
    if (validated.files.length > 0) {
      await ProjectFile.insertMany(
        validated.files.map((file) => ({
          projectId: projectObjectId,
          snapshotId: snapshot._id,
          ...file,
        })),
        { ordered: true },
      );
    }

    await ProjectSnapshot.updateOne(
      { _id: snapshot._id, status: "writing" },
      { $set: { status: "complete" } },
    );

    const updatedProject = await Project.findOneAndUpdate(
      {
        _id: projectObjectId,
        ownerId: ownerObjectId,
        version: expectedVersion,
      },
      {
        $set: {
          latestSnapshotId: snapshot._id,
        },
        $inc: { version: 1 },
      },
      { new: true }, // Fixed: Mongoose standard option for returning the updated document
    ).lean();

    if (!updatedProject) {
      throw new Error(
        "Concurrent update detected; retry from the latest version",
      );
    }

    return {
      projectId: projectId,
      snapshotId: snapshot._id.toString(),
      version: nextVersion,
      fileCount: validated.files.length,
      totalBytes: validated.totalBytes,
    };
  } catch (error) {
    // Compensate for partial writes using Promise.allSettled
    await Promise.allSettled([
      ProjectFile.deleteMany({
        snapshotId: snapshot._id,
      }),
      ProjectSnapshot.deleteOne({
        _id: snapshot._id,
      }),
    ]);

    throw error;
  }
}
