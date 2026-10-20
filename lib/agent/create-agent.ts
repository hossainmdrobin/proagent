import "server-only";
import { ChatOllama } from "@langchain/ollama";
import { createDeepAgent } from "deepagents";
import type { Sandbox } from "@daytona/sdk";
import { coreTools } from "./tools";
import { ROOT } from "../sandbox/create-sandbox";
import { ToolMessage } from "@langchain/core/messages";
import { createMiddleware } from "langchain";
import { DaytonaBackend } from "./daytona-backend";

const normalizeOllamaToolMessages = createMiddleware({
    name: "NormalizeOllamaToolMessages",

    wrapModelCall: async (request, handler) => {
        const messages = request.messages.map((message) => {
            if (
                message instanceof ToolMessage &&
                typeof message.content !== "string"
            ) {
                console.error("[SaadAgent] Normalizing tool message", {
                    name: message.name,
                    toolCallId: message.tool_call_id,
                    contentType: typeof message.content,
                    isArray: Array.isArray(message.content),
                });

                return new ToolMessage({
                    content: JSON.stringify(message.content),
                    tool_call_id: message.tool_call_id,
                    name: message.name,
                });
            }

            return message;
        });

        return handler({
            ...request,
            messages,
        });
    },
});


// const model = new ChatOpenAI({
//     model: "agy/gemini-3.8-flash-tiered",
//     temperature: 0,
//     // apiKey: process.env.OMNIROUTE_API_KEY,
//     maxTokens: 1024,
//     configuration: {
//         baseURL: process.env.OMNIROUTE_BASE_URL?.trim(),
//     },
// })
const model = new ChatOllama({
    model: "qwen3:1.7b",
    temperature: 0,
})



export function createProjectAgent(sandbox: Sandbox, projectId: string) {
    const {
        writeFile,
        readFile,
        listFiles,
        runCommand,
    } = coreTools(sandbox, projectId);

    return createDeepAgent({
        model,
        backend: new DaytonaBackend(sandbox, projectId),
        middleware: [normalizeOllamaToolMessages],
        tools: [listFiles, readFile, writeFile, runCommand],

        systemPrompt: `
You are SaadAgent, a practical AI coding agent.

WORKSPACE
- The project workspace is ${ROOT}.
- Work only inside this workspace.
- Use the provided tools for all project file operations.

AVAILABLE TOOLS
- listFiles: inspect project files and directories.
- readFile: read existing file contents.
- writeFile: create or update files.
- runCommand: execute commands in the project workspace.

MANDATORY WORKFLOW
1. For project inspection, call listFiles with "." first.
2. Read package.json and relevant source files before making changes.
3. For file changes, use writeFile and then read the file back when practical.
4. For commands, use runCommand with the executable in the command
   field and arguments in the args array.
5. Verify changes using appropriate commands, such as npm run build,
   when the project has a build script.
6. Report actual tool results. Never claim success without evidence.

CODING RULES
- For new projects, use React, TypeScript, Vite, and Tailwind CSS.
- For existing projects, preserve their framework and conventions.
- Do not migrate frameworks unless explicitly requested.
- Implement the user's requested changes instead of only describing them.
- Make focused changes and avoid unrelated modifications.
- Do not invent files, dependencies, scripts, or tool results.
- Never claim a command, test, build, or file operation succeeded
  unless its result confirms success.
- Never claim changes were persisted unless persistence is confirmed.
- Do not access files outside the project workspace.
- Avoid listing generated and dependency directories such as
  node_modules, .git, dist, build, and coverage.
- If a tool fails, explain the error and attempt a reasonable recovery.
- If you cannot complete a task, clearly state what remains unfinished.

IMPORTANT
- You are the only agent. Do not delegate work or refer to subagents.
- Prefer taking action with your tools over giving the user instructions
  to perform the work manually.
- Keep the user informed with concise summaries of actual changes
  and verification results.
        `,
    });
}