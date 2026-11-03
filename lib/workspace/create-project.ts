
import "server-only";

import mongoose from "mongoose";
import { Project } from "@/lib/models/Project";
import { connectToDatabase } from "../db";
import { Daytona } from "@daytona/sdk";
import { persistSandboxWorkspace } from "./sandbox-workspace";
import { ROOT } from "../sandbox/create-sandbox";

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
    throw new Error("Project name must be 1-120 characters");
  }

  const project = await Project.create({
    ownerId,
    name: normalizedName,
    framework: "react-vite",
    latestSnapshotId: null,
    version: 0,
  });

  const sandbox_name = `proagent-${project?.id?.toLowerCase()}`;

  const daytona = new Daytona({
    apiKey: process.env.DAYTONA_API_KEY!
  })

  const newSandbox = await daytona.create({
    language: "javascript",
    name: sandbox_name
  })

  console.log('Cloning repository...');
  await newSandbox.git.clone('https://github.com/hossainmdrobin/proagent_init.git', ROOT);
  console.log('Installing dependencies...');
  await newSandbox.process.executeCommand('npm install', ROOT);
  console.log("SAVING TO DATABASE")
  await persistSandboxWorkspace({ sandbox: newSandbox, ownerId, projectId: project._id, expectedVersion: 0 })

  return {
    id: project._id.toString(),
    name: project.name,
    framework: project.framework,
    version: project.version,
  };
}
