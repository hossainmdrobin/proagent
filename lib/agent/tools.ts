import "server-only";
// import { connectToDatabase } from "@/lib/db";
// import { Project } from "@/lib/models/Project";
import type { Sandbox } from "@daytona/sdk";
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


// async function waitForPreview(
//     url: string,
//     attempts = 15,
// ): Promise<boolean> {
//     for (let i = 0; i < attempts; i++) {
//         try {
//             const response = await fetch(url, {
//                 signal: AbortSignal.timeout(2_000),
//             });

//             if (response.ok) return true;
//         } catch {
//             // The development server may still be starting.
//         }

//         await new Promise((resolve) => setTimeout(resolve, 1_000));
//     }

//     return false;
// }



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
            const content = await sandbox.fs.downloadFile(safePath(path));

            return content.toString().slice(0, 2000)
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




    // const startPreview = tool(
    //     async () => {
    //         await connectToDatabase();

    //         const previewUrl = sandbox.domain(3001);

    //         // Reuse an already-running preview.
    //         if (await waitForPreview(previewUrl, 1)) {
    //             await Project.updateOne(
    //                 { _id: projectId },
    //                 {
    //                     $set: {
    //                         previewUrl,
    //                         previewStatus: "ready",
    //                     },
    //                 },
    //             );

    //             return JSON.stringify({
    //                 status: "ready",
    //                 previewUrl,
    //                 message: "The preview server is already responding.",
    //             });
    //         }

    //         // Record startup before launching the server.
    //         await Project.updateOne(
    //             { _id: projectId },
    //             {
    //                 $set: {
    //                     previewUrl,
    //                     previewStatus: "starting",
    //                 },
    //             },
    //         );

    //         try {
    //             const result = await sandbox.runCommand({
    //                 cmd: "npm",
    //                 args: [
    //                     "run",
    //                     "dev",
    //                     "--",
    //                     "--host",
    //                     "0.0.0.0",
    //                     "--port",
    //                     "3001",
    //                 ],
    //                 cwd: ROOT,
    //                 detached: true,
    //             });

    //             await Project.updateOne(
    //                 { _id: projectId },
    //                 {
    //                     $set: {
    //                         previewCommandId: result.cmdId,
    //                         previewUrl,
    //                         previewStatus: "starting",
    //                     },
    //                 },
    //             );

    //             const ready = await waitForPreview(previewUrl);

    //             await Project.updateOne(
    //                 { _id: projectId },
    //                 {
    //                     $set: {
    //                         previewStatus: ready ? "ready" : "failed",
    //                     },
    //                 },
    //             );

    //             return JSON.stringify({
    //                 status: ready ? "ready" : "failed",
    //                 commandId: result.cmdId,
    //                 previewUrl,
    //                 message: ready
    //                     ? "Preview server is responding."
    //                     : "Preview did not respond within 15 seconds. Check server logs.",
    //             });
    //         } catch (error) {
    //             await Project.updateOne(
    //                 { _id: projectId },
    //                 { $set: { previewStatus: "failed" } },
    //             );

    //             throw error;
    //         }
    //     },
    //     {
    //         name: "start_preview_server",
    //         description:
    //             "Start the project's development server in detached mode on port 3001. Reuse an existing responsive preview. Use after dependencies are installed and the project has a dev script.",
    //         schema: z.object({}),
    //     },
    // );

    // const getPreviewStatus = tool(
    //     async ({ commandId }) => {
    //         await connectToDatabase();

    //         const previewUrl = sandbox.domain(3001);

    //         try {
    //             // First check whether the preview is actually responding.
    //             const ready = await waitForPreview(previewUrl, 1);

    //             if (ready) {
    //                 await Project.updateOne(
    //                     { _id: projectId },
    //                     {
    //                         $set: {
    //                             previewUrl,
    //                             previewCommandId: commandId,
    //                             previewStatus: "ready",
    //                         },
    //                     },
    //                 );

    //                 return JSON.stringify({
    //                     status: "ready",
    //                     commandId,
    //                     previewUrl,
    //                     message: "The preview server is responding.",
    //                 });
    //             }

    //             // If it is not responding, inspect the command.
    //             const command = await sandbox.getCommand(commandId);
    //             const exitCode = command.exitCode;

    //             const status =
    //                 exitCode === null
    //                     ? "starting"
    //                     : exitCode === 0
    //                         ? "stopped"
    //                         : "failed";

    //             await Project.updateOne(
    //                 { _id: projectId },
    //                 {
    //                     $set: {
    //                         previewUrl,
    //                         previewCommandId: commandId,
    //                         previewStatus: status,
    //                     },
    //                 },
    //             );

    //             return JSON.stringify({
    //                 status,
    //                 commandId,
    //                 exitCode,
    //                 previewUrl,
    //             });
    //         } catch (error) {
    //             return JSON.stringify({
    //                 status: "unknown",
    //                 commandId,
    //                 message:
    //                     error instanceof Error
    //                         ? error.message
    //                         : "Could not inspect the preview.",
    //             });
    //         }
    //     },
    //     {
    //         name: "get_preview_status",
    //         description:
    //             "Inspect a previously started preview command using its command ID. Use the ID returned by start_preview_server.",
    //         schema: z.object({
    //             commandId: z.string().min(1),
    //         }),
    //     },
    // );

    return { writeFile, readFile, runCommand, listFiles }
}
