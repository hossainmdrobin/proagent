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



export function createProjectAgent(sandbox: Sandbox) {
    const { writeFile, readFile, listFiles, runCommand } = coreTools(sandbox)
    const planner = createPlannerAgent(model, sandbox);
    const coding = createCodingAgent(model,sandbox);
    const ui = createUIAgent(model, sandbox);
    const backend = createBackendAgent(model, sandbox);
    const testing = createTestingAgent(model, sandbox);
    const reviewer = createReviewerAgent(model, sandbox);
    return createDeepAgent({
        model,
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