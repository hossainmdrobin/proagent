import type { Sandbox } from "@vercel/sandbox";
import { tool } from "langchain";
import path from "node:path";
import { z } from "zod";

export const ROOT = "/vercel/sandbox/project";

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


export const coreTools = (sandbox: Sandbox,) => {
    const writeFile = tool(
        async ({ path, content }) => {
            const target = safePath(path);

            await sandbox.fs.mkdir(
                target.substring(0, target.lastIndexOf("/")),
                { recursive: true },
            );

            await sandbox.fs.writeFile(target, content);

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
            const content = await sandbox.fs.readFile(
                safePath(path),
                "utf8",
            );

            return String(content).slice(0, 20_000);
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
            const result = await sandbox.runCommand({
                cmd: "ls",
                args: ["-la", safePath(path)],
                cwd: ROOT,
            });

            return (await result.stdout()).slice(0, 10_000);
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
            const result = await sandbox.runCommand({
                cmd: command,
                args,
                cwd: ROOT,
            });

            return JSON.stringify({
                exitCode: result.exitCode,
                stdout: (await result.stdout()).slice(0, 12_000),
                stderr: (await result.stderr()).slice(0, 12_000),
            });
        },
        {
            name: "run_project_command",
            description:
                "Run a project command inside the isolated sandbox.",
            schema: z.object({
                command: z.enum(["node", "npm"]),
                args: z.array(z.string().max(200)).max(20),
            }),
        },
    );


    const startPreview = tool(
        async () => {
            const result = await sandbox.runCommand({
                cmd: "npm",
                args: [
                    "run",
                    "dev",
                    "--",
                    "--hostname",
                    "0.0.0.0",
                    "--port",
                    "3001",
                ],
                cwd: ROOT,
                detached: true,
            });

            return JSON.stringify({
                status: "starting",
                commandId: result.cmdId,
                previewUrl: sandbox.domain(3001),
                message: "Preview server started asynchronously. Verify that it becomes ready before opening the URL.",
            });
        },
        {
            name: "start_preview_server",
            description:
                "Start the project's development server in detached mode on port 3001. Use after dependencies are installed and the project has a dev script. Do not start another server if one is already running.",
            schema: z.object({}),
        },
    );

    return { writeFile, readFile, runCommand, listFiles, startPreview }
}
