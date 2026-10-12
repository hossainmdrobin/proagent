
import "server-only";

import mongoose from "mongoose";
import { Project } from "@/lib/models/Project";
import { connectToDatabase } from "../db";

export async function createProject({
  ownerId,
  name,
}: {
  ownerId: string;
  name: string;
}) {
  await connectToDatabase();

  if (!mongoose.isValidObjectId(ownerId)) {
    throw new Error("Invalid owner ID");
  }

  const normalizedName = name.trim();

  if (!normalizedName || normalizedName.length > 120) {
    throw new Error("Project name must be 1–120 characters");
  }

  const project = await Project.create({
    ownerId,
    name: normalizedName,
    framework: "nextjs",
    latestSnapshotId: null,
    version: 0,
  });

  return {
    id: project._id.toString(),
    name: project.name,
    framework: project.framework,
    version: project.version,
  };
}
