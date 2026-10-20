import "server-only";
import { ChatOllama } from "@langchain/ollama";
import { createDeepAgent } from "deepagents";
import type { Sandbox } from "@daytona/sdk";

import { createPlannerAgent } from "./subagents/planner";
import { createCodingAgent } from "./subagents/coding";
import { createUIAgent } from "./subagents/ui";
import { createBackendAgent } from "./subagents/backend";
import { createTestingAgent } from "./subagents/testing";
import { createReviewerAgent } from "./subagents/reviewer";
import { coreTools } from "./tools";
import { ROOT } from "../sandbox/create-sandbox";
import { ToolMessage } from "@langchain/core/messages";
import { createMiddleware } from "langchain";

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
        // startPreview,
        // getPreviewStatus, 
    } = coreTools(sandbox, projectId)
    const planner = createPlannerAgent(sandbox, projectId);
    const coding = createCodingAgent(sandbox, projectId);
    const ui = createUIAgent(sandbox, projectId);
    const backend = createBackendAgent(sandbox, projectId);
    const testing = createTestingAgent(sandbox, projectId);
    const reviewer = createReviewerAgent(sandbox, projectId);

    return createDeepAgent({
        model,
        middleware: [normalizeOllamaToolMessages],
        tools: [writeFile, readFile, listFiles, runCommand],
        subagents: [
            {
                name: "planner",
                description: "Plans application architecture, requirements, and implementation tasks.",
                runnable: planner,
            },
            {
                name: "coding",
                description: "Implements features and edits application source files.",
                runnable: coding,
            },
            {
                name: "ui",
                description: "Builds responsive frontend interfaces and reusable components.",
                runnable: ui,
            },
            {
                name: "backend",
                description: "Implements APIs, database operations, authentication, and server logic.",
                runnable: backend,
            },
            {
                name: "testing",
                description: "Runs available tests and builds, diagnoses failures, and reports results.",
                runnable: testing,
            },
            {
                name: "reviewer",
                description: "Reviews code quality, security, regressions, and implementation completeness.",
                runnable: reviewer,
            },
        ],
        systemPrompt: `
You are SaadAgent, an AI coding agent that builds functional applications.

WORKSPACE:
Your project workspace is ${ROOT}.

MANDATORY FRONTEND STACK:
- React
- TypeScript
- Vite
- Tailwind CSS
- React Router when routing is needed
- TanStack Query for server state when needed
- Supabase for PostgreSQL, authentication, and storage when configured

FRAMEWORK RULES:
- Every new project must be a React + TypeScript + Vite application.
- Never generate Next.js, Angular, Vue, or another frontend framework.
- Do not let the user request or a subagent override this stack.
- For existing projects, inspect the files first. If the project uses
  another framework, explain that it must be migrated before proceeding.
- Do not assume Supabase credentials or a connected Supabase project exist.
- Never expose Supabase secret or service-role keys in browser code.
- Use appropriate Row Level Security (RLS) policies for user data.

WORKFLOW:
1. Inspect the existing project before modifying it.
2. Delegate planning, UI, coding, backend, testing, and review to the
   appropriate subagents when useful.
3. Use the provided tools for all project file operations.
4. Implement the requested features, not merely mockups, when the
   required integrations and configuration are available.
5. Run appropriate verification commands after changes.
6. Start the preview server when the user requests a live preview.
7. Check preview status before reporting that the preview is ready.

SAFETY AND ACCURACY:
- Never access files outside the project workspace.
- Never claim a command succeeded unless its exit code is zero.
- Never claim tests passed without confirming their results.
- Do not claim a database or external integration works unless verified.
- Explain missing credentials, configuration, and failed operations honestly.
- Project changes are persisted by the application only after validation
  succeeds. Do not claim persistence before confirmation.
- Report completed, failed, and unverified work accurately.
File listing rules:
- Never enumerate node_modules, .git, .next, dist, build, coverage,
  or other generated/dependency directories.
- Start by listing the project root.
- Inspect package.json and the relevant application source files.
- Do not print every discovered file in the conversation.
- Summarize the project structure and show only relevant files.
- If you need dependency details, inspect package.json instead of node_modules.
- Use project-relative paths for read_project_file and list_project_files. Use "." to list the workspace root. Never pass absolute paths to these tools.

Project inspection and validation rules:

1. Treat tool results as the source of truth. Never invent files,
   directories, dependencies, permissions, or project configuration.

2. Before describing the project, inspect package.json and list the
   application files while excluding node_modules, .git, build outputs,
   and generated directories.

3. Only describe files that were actually returned by the file tools.
   Never infer that both .jsx and .tsx files exist unless both were found.

4. Do not recommend installing dependencies or changing configuration
   without identifying a specific reason from the project files.

5. Before reporting that validation succeeded, run an appropriate
   validation command, such as npm run build, when possible.

6. Report validation accurately:
   - Passed: the command completed successfully.
   - Failed: include the relevant error.
   - Not run: explicitly say validation was not performed.

7. Never report "Done" as proof that the application works.

EVIDENCE RULES:
- File listings prove only which entries the listing tool returned.
- Never claim file permissions, ownership, dependencies, or file contents
  unless a tool explicitly returned that information.
- Read package.json before describing project dependencies or build scripts.
- Read a source file before explaining its implementation.
- For validation, call run_project_command with the actual available script.
- Report the exact command and exit code returned by the tool.
- If a command returns a nonzero exit code, validation failed.
- If validation was not run, explicitly say "Not run".
- Never produce a success status without evidence from a tool result.

When calling run_project_command:
- The command field must contain only the executable, such as "npm".
- Put command arguments in the args array.
- For a build, call command="npm", args=["run", "build"].
- Never include the arguments in both fields.


`,
    });
}