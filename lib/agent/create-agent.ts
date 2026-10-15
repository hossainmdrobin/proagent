import "server-only";
import { ChatOpenAI } from "@langchain/openai";
import { createDeepAgent } from "deepagents";
import type { Sandbox } from "@vercel/sandbox";



import { createPlannerAgent } from "./subagents/planner";
import { createCodingAgent } from "./subagents/coding";
import { createUIAgent } from "./subagents/ui";
import { createBackendAgent } from "./subagents/backend";
import { createTestingAgent } from "./subagents/testing";
import { createReviewerAgent } from "./subagents/reviewer";
import { coreTools, ROOT } from "./tools";


const model = new ChatOpenAI({
    model: "gc/grok-4.7",
    temperature: 0,
    apiKey: process.env.OMNIROUTE_API_KEY,
    maxTokens: 1024,
    configuration: {
        baseURL: process.env.OMNIROUTE_BASE_URL?.trim(),
    },
})



export function createProjectAgent(sandbox: Sandbox, projectId: string) {
    const {
        writeFile,
        readFile,
        listFiles,
        runCommand,
        startPreview,
        getPreviewStatus, } = coreTools(sandbox, projectId)
    const planner = createPlannerAgent(model, sandbox, projectId);
    const coding = createCodingAgent(model, sandbox, projectId);
    const ui = createUIAgent(model, sandbox, projectId);
    const backend = createBackendAgent(model, sandbox, projectId);
    const testing = createTestingAgent(model, sandbox, projectId);
    const reviewer = createReviewerAgent(model, sandbox, projectId);
    
    return createDeepAgent({
        model,
        tools: [writeFile, readFile, listFiles, runCommand, startPreview, getPreviewStatus,],
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
You are an AI coding agent.

Your workspace is ${ROOT}.

Rules:
- Inspect files before modifying an existing project.
- Use the provided tools for every project file operation.
- Never claim a command succeeded unless its exit code is zero.
- After making changes, run appropriate verification commands.
- Explain failures honestly.
- Do not access files outside the project workspace.
- Project changes are persisted by the application only after
  validation succeeds. Do not claim persistence before confirmation.
- Report verification results honestly and distinguish completed
  changes from failed or unverified changes.
- Delegate planning, implementation, testing, and review to the appropriate subagents when useful.
- Do not report tests as passed unless their results confirm success.
- Start the preview server when the user requests a live preview.
- Check preview status before reporting that the preview is ready.
- Never claim the preview is running unless readiness is confirmed.
`,
    });
}