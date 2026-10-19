import "server-only";
// import { connectToDatabase } from "@/lib/db";
// import { Project } from "@/lib/models/Project";
import type { Sandbox } from "@daytona/sdk";
import { tool } from "langchain";
import path from "node:path";
import { z } from "zod";
import { ROOT } from "../sandbox/create-sandbox";


export function safePath(input: string): string {
    const value = input.trim();

    // An empty path or "." means the project root.
    if (!value || value === ".") {
        return ROOT;
    }

    // Accept both Windows and Unix separators, but reject
    // absolute paths and Windows drive paths.
    if (
        value.includes("\0") ||
        path.posix.isAbsolute(value) ||
        path.win32.isAbsolute(value)
    ) {
        throw new Error("Invalid project path");
    }

    const normalized = value.replace(/\\/g, "/");
    const segments = normalized.split("/");

    if (segments.some((segment) => segment === "..")) {
        throw new Error("Invalid project path");
    }

    const resolved = path.posix.resolve(ROOT, normalized);
    const relative = path.posix.relative(ROOT, resolved);

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
        async ({ path, content }) => {
            const target = safePath(path);

            await sandbox.fs.createFolder(
                target.substring(0, target.lastIndexOf("/")),
                "777",
            );
            const fileContent = Buffer.from(content)
            await sandbox.fs.uploadFile(fileContent, target);

            return `File written: ${path}`;
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
        async ({ path }) => {
            try {
                // Optional: check file details or existence first if needed, 
                // otherwise let downloadFile fetch it.
                const content = await sandbox.fs.downloadFile(safePath(path));

                // Convert buffer/Uint8Array to string safely
                const text = Buffer.isBuffer(content)
                    ? content.toString("utf-8")
                    : Buffer.from(content).toString("utf-8");

                if (text.length > 2000) {
                    return text.slice(0, 2000);
                }

                return text;
            } catch (error: any) {
                // Return the error message to the agent so it can self-correct
                return `Error reading file: ${error.message || error}`;
            }
        },
        {
            name: "read_project_file",
            description: "Read a project file.",
            schema: z.object({
                path: z.string().min(1).max(200),
            }),
        },
    );

    const listFiles = tool(
        async ({ path }) => {
            const result = await sandbox.fs.listFiles(path, { depth: 4 });

            return (await result).slice(0, 10_000);
        },
        {
            name: "list_project_files",
            description:
                "List files and directories inside the project. " +
                'Use "." to list the project root. ' +
                "Paths must be relative to the project root, such as " +
                '"src" or "src/app". Never use absolute paths.',
            schema: z.object({
                path: z.string().default("."),
            }),
        },
    );

    const runCommand = tool(
        async ({ command, args }) => {
            // Combine the command and its arguments into a single shell command string
            const fullCommand = [command, ...args].join(" ");

            // Correct Daytona execution: command string as 1st arg, cwd as 2nd arg
            const result = await sandbox.process.executeCommand(fullCommand, ROOT);

            return JSON.stringify({
                exitCode: result.exitCode,
                // Daytona returns the text output directly under `result.result` (or `result`)
                output: (result.result || "").slice(0, 12_000),
            });
        },
        {
            name: "run_project_command",
            description: "Run a project command inside the isolated sandbox.",
            schema: z.object({
                command: z.enum(["node", "npm", "npx", "git"]), // Added npx/git for flexibility if needed
                args: z.array(z.string().max(200)).max(20),
            }),
        },
    );

    return { writeFile, readFile, runCommand, listFiles }
}
