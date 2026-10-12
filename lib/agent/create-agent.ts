import "server-only";

import { tool } from "langchain";
import { ChatOpenAI } from "@langchain/openai";
import { createDeepAgent } from "deepagents";
import { z } from "zod";
import type { Sandbox } from "@vercel/sandbox";

const ROOT = "/vercel/sandbox/project";

function safePath(path: string) {
    const normalized = path.replace(/\\/g, "/");

    if (
        normalized.startsWith("/") ||
        normalized.split("/").some(
            (part) => part === ".." || part === ".",
        ) ||
        normalized.includes("\0")
    ) {
        throw new Error("Invalid project path");
    }

    return `${ROOT}/${normalized}`;
}

export function createProjectAgent(sandbox: Sandbox) {
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
            description: "List files and directories in the project.",
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

    return createDeepAgent({
        model: new ChatOpenAI({
            model: "gpt-4.1-mini",
            temperature: 0,
            maxTokens: 4096,
        }),
        tools: [writeFile, readFile, listFiles, runCommand],
        systemPrompt: `
You are an AI coding agent.

Your workspace is ${ROOT}.

Rules:
- Inspect files before modifying an existing project.
- Use the provided tools for every project file operation.
- Never claim a command succeeded unless its exit code is zero.
- After making changes, run appropriate verification commands.
- Explain failures honestly.
- Do not access files outside the project workspace.
- Do not claim files are permanently saved; persistence is not
  implemented in this milestone.
- Work within the available tools and report limitations.
`,
    });
}