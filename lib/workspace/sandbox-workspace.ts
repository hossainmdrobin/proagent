
import "server-only";

import type { Sandbox } from "@daytona/sdk";
import type { WorkspaceFile } from "./save-workspace";
import { saveWorkspace } from "./save-workspace";
import { restoreWorkspace } from "./restore-workspace";
import { ROOT } from "../sandbox/create-sandbox";

const IGNORED_DIRECTORIES = new Set([
  "node_modules",
  ".next",
  ".git",
  "dist",
  "build",
  "coverage",
]);

function resolveProjectPath(relativePath: string) {
  const parts = relativePath.replace(/\\/g, "/").split("/");

  if (
    !relativePath ||
    relativePath.startsWith("/") ||
    parts.some(
      (part) => !part || part === "." || part === "..",
    )
  ) {
    throw new Error("Invalid project file path");
  }

  return `${ROOT}/${parts.join("/")}`;
}

export async function collectSandboxFiles(
  sandbox: Sandbox,
): Promise<WorkspaceFile[]> {
  const files: WorkspaceFile[] = [];

  async function walk(directory: string, relative = ""): Promise<void> {
    // List immediate children of the directory
    const entries = await sandbox.fs.listFiles(directory);

    for (const entry of entries) {
      const relativePath = relative
        ? `${relative}/${entry.name}`
        : entry.name;

      // Skip ignored directories
      if (entry.isDir && IGNORED_DIRECTORIES.has(entry.name)) {
        continue;
      }

      const absolutePath = `${directory}/${entry.name}`;

      if (entry.isDir) {
        // Recursively walk into subdirectories
        await walk(absolutePath, relativePath);
      } else {
        // It's a file, read its content
        const result = await sandbox.process.executeCommand(`cat "${absolutePath}"`, ROOT);

        if (result.exitCode === 0) {
          files.push({
            path: relativePath,
            content: result.result,
          });
        } else {
          console.error(`Failed to read file ${absolutePath}:`, result.result);
        }
      }
    }
  }

  await walk(ROOT);

  return files;
}

export async function persistSandboxWorkspace({
  sandbox,
  projectId,
  ownerId,
  expectedVersion,
}: {
  sandbox: Sandbox;
  projectId: string;
  ownerId: string;
  expectedVersion: number;
}) {
  console.log("COLLECTING SANBOX FILES...");
  const files = await collectSandboxFiles(sandbox);
console.log("SAVING THE WORKSPACE...")
  return saveWorkspace({
    projectId,
    ownerId,
    expectedVersion,
    files,
  });
}

export async function restoreSandboxWorkspace({
  sandbox,
  projectId,
  ownerId,
  version,
}: {
  sandbox: Sandbox;
  projectId: string;
  ownerId: string;
  version?: number;
}) {
  const workspace = await restoreWorkspace({
    projectId,
    ownerId,
    version,
  });

  await sandbox.fs.createFolder(ROOT, "777");

  for (const file of workspace.files) {
    const target = resolveProjectPath(file.path);
    const parent = target.slice(0, target.lastIndexOf("/"));

    await sandbox.fs.createFolder(parent, "777");
    await sandbox.fs.uploadFile(Buffer.from(file.content, 'utf-8'), target);
  }

  return {
    projectId: workspace.projectId,
    version: workspace.version,
    restoredFileCount: workspace.files.length,
  };
}
