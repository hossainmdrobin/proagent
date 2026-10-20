import "server-only";
import type { Sandbox } from "@daytona/sdk";
import { tool } from "langchain";
import path from "node:path";
import { z } from "zod";
import { ROOT } from "../sandbox/create-sandbox";


export function safePath(input: string): string {
    const value = input.trim();

    // Empty path or "." means the project root.
    if (!value || value === ".") {
        return ROOT;
    }

    // Reject null bytes and absolute paths.
    if (
        value.includes("\0") ||
        path.posix.isAbsolute(value) ||
        path.win32.isAbsolute(value)
    ) {
        throw new Error("Invalid project path");
    }

    // Normalize Windows-style separators to forward slashes.
    const normalized = value.replace(/\\/g, "/");

    // Reject attempts to navigate outside the project.
    const segments = normalized.split("/");

    if (segments.some((segment) => segment === "..")) {
        throw new Error("Invalid project path");
    }

    // Resolve the path inside the project workspace.
    const resolved = path.posix.resolve(ROOT, normalized);
    const relative = path.posix.relative(ROOT, resolved);

    // Final security check: path must remain inside ROOT.
    if (
        relative === ".." ||
        relative.startsWith("../") ||
        path.posix.isAbsolute(relative)
    ) {
        throw new Error("Invalid project path");
    }

    return resolved;
}


export const coreTools = (sandbox: Sandbox, projectId: string) => {
    const writeFile = tool(
        async ({ path: filePath, content }) => {
            const target = safePath(filePath);
            const parentDir = path.posix.dirname(target);

            // Only create parent folder if it's a sub-directory inside ROOT
            if (parentDir !== ROOT && parentDir.startsWith(ROOT)) {
                await sandbox.fs.createFolder(parentDir, "777");
            }

            const fileContent = Buffer.from(content);
            await sandbox.fs.uploadFile(fileContent, target);

            return `File written: ${filePath}`;
        },
        {
            name: "write_project_file",
            description: "Create or update a text file in the project.",
            schema: z.object({
                path: z.string().min(1).max(200),
                content: z.string().max(100_000),
            }),
        },
    );

    const readFile = tool(
        async ({ path: filePath }) => {
            try {
                const content = await sandbox.fs.downloadFile(safePath(filePath));

                const text = Buffer.isBuffer(content)
                    ? content.toString("utf-8")
                    : Buffer.from(content).toString("utf-8");

                if (text.length > 2000) {
                    return text.slice(0, 2000) + "\n...[file truncated due to length]";
                }

                return text;
            } catch (error: any) {
                return `Error reading file: ${error.message || error}`;
            }
        },
        {
            name: "read_project_file",
            description: "Read a project file. Returns up to the first 2000 characters.",
            schema: z.object({
                path: z.string().min(1).max(200),
            }),
        },
    );



    const listFiles = tool(
        async ({ path: dirPath }) => {
            try {
                const target =
                    dirPath.trim().replace(/\\/g, "/") === ROOT
                        ? ROOT
                        : safePath(dirPath);
                const result = await sandbox.fs.listFiles(target, { depth: 4 });

                if (!Array.isArray(result)) {
                    return JSON.stringify({
                        error: "Unexpected response from Daytona listFiles",
                    });
                }

                const excludedDirs = new Set([
                    "node_modules",
                    ".git",
                    ".next",
                    "dist",
                    "build",
                    "coverage",
                    ".turbo",
                    ".vercel",
                    ".cache",
                ]);

                const files: string[] = [];

                for (const entry of result) {
                    const rawPath = entry.path ?? entry.name;

                    if (typeof rawPath !== "string" || !rawPath.trim()) {
                        continue;
                    }

                    const normalized = rawPath.replace(/\\/g, "/");
                    const segments = normalized.split("/").filter(Boolean);

                    if (segments.some((segment) => excludedDirs.has(segment))) {
                        continue;
                    }

                    files.push(normalized);
                }

                return JSON.stringify({
                    requestedDirectory: dirPath,
                    returnedEntries: files.length,
                    files: files.slice(0, 200),
                    truncated: files.length > 200,
                });
            } catch (error: unknown) {
                return JSON.stringify({
                    error: error instanceof Error
                        ? error.message
                        : String(error),
                });
            }
        },
        {
            name: "list_project_files",
            description:
                "List actual project file entries. Returns file paths only, not permissions or ownership. Excludes common dependency and generated directories. Use '.' for the project root. Never infer unreturned files.",
            schema: z.object({
                path: z.string().default("."),
            }),
        },
    );



    const runCommand = tool(
        async ({ command, args }) => {
            // Fixed: Safely escape arguments with spaces using JSON.stringify or basic quoting
            const escapedArgs = args.map(arg => {
                // If arg contains spaces or special characters, wrap it safely in quotes
                if (/[ \t\n"'`$|&;<>]/.test(arg)) {
                    return `"${arg.replace(/"/g, '\\"')}"`;
                }
                return arg;
            });

            const fullCommand = args.length > 0
                ? [command, ...escapedArgs].join(" ")
                : command;

            const result = await sandbox.process.executeCommand(fullCommand, ROOT);

            return JSON.stringify({
                exitCode: result.exitCode,
                output: (result.result || "").slice(0, 12_000),
            });
        },
        {
            name: "run_project_command",
            description: "Run a project command inside the isolated sandbox.",
            schema: z.object({
                command: z.string().min(1).max(300),
                args: z.array(z.string().max(300)).max(20).default([]),
            }),
        },
    );

    return { writeFile, readFile, runCommand, listFiles };
};