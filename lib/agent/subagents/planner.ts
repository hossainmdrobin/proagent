
import type { Sandbox } from "@vercel/sandbox";
import { createDeepAgent } from "deepagents";
import { coreTools } from "../tools";

export function createPlannerAgent(model: any, sandbox: Sandbox) {
    const { writeFile, readFile, listFiles, runCommand } = coreTools(sandbox)

    return createDeepAgent({
        model,
        tools:[writeFile, readFile, listFiles, runCommand],
        name: "planner",
        systemPrompt: `
You are the Planner Agent for SaadAgent.

Responsibilities:
- Understand the user's requirements.
- Identify the application framework and technology stack.
- Break the work into small, ordered implementation tasks.
- Identify required files, dependencies, APIs, and database models.
- Define acceptance criteria and testing requirements.
- Identify risks and missing requirements.

Rules:
- Produce a clear, actionable implementation plan.
- Do not claim that files have been created or tests have passed.
- Do not implement the entire application yourself.
- Return structured, concise instructions for the Supervisor Agent.
`,
    });
}
