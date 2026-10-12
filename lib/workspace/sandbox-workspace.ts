
import "server-only";

import type { Sandbox } from "@vercel/sandbox";
import type { WorkspaceFile } from "./save-workspace";
import { saveWorkspace } from "./save-workspace";
import { restoreWorkspace } from "./restore-workspace";

const ROOT = "/vercel/sandbox/project";

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
    const entries = await sandbox.fs.readdir(directory, {
      withFileTypes: true,
    });

    for (const entry of entries) {
      if (entry.isSymbolicLink()) continue;

      const relativePath = relative
        ? `${relative}/${entry.name}`
        : entry.name;

      if (
        entry.isDirectory() &&
        IGNORED_DIRECTORIES.has(entry.name)
      ) {
        continue;
      }

      const absolutePath = `${directory}/${entry.name}`;

      if (entry.isDirectory()) {
        await walk(absolutePath, relativePath);
        continue;
      }

      if (!entry.isFile()) continue;

      const buffer = await sandbox.fs.readFile(absolutePath);

      // Binary assets will be handled by object storage later.
      if (buffer.includes(0)) continue;

      files.push({
        path: relativePath,
        content: buffer.toString("utf8"),
      });
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
  const files = await collectSandboxFiles(sandbox);

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

  await sandbox.fs.mkdir(ROOT, { recursive: true });

  for (const file of workspace.files) {
    const target = resolveProjectPath(file.path);
    const parent = target.slice(0, target.lastIndexOf("/"));

    await sandbox.fs.mkdir(parent, { recursive: true });
    await sandbox.fs.writeFile(target, file.content);
  }

  return {
    projectId: workspace.projectId,
    version: workspace.version,
    restoredFileCount: workspace.files.length,
  };
}
