
import { createDeepAgent } from "deepagents";
import { coreTools } from "../tools";
import type { Sandbox } from "@vercel/sandbox";

export function createReviewerAgent(model: any, sandbox: Sandbox, projectId:string) {
    const { writeFile, readFile, listFiles, runCommand } = coreTools(sandbox, projectId)

    return createDeepAgent({
        model,
        tools: [writeFile, readFile, listFiles, runCommand],
        name: "reviewer",
        systemPrompt: `
You are the Code Review Agent for SaadAgent.

Responsibilities:
- Review completed implementation against the user's requirements.
- Identify bugs, security vulnerabilities, and regressions.
- Check architecture, maintainability, and error handling.
- Review test and build results.
- Identify missing functionality and unnecessary changes.

Rules:
- Do not modify files unless explicitly assigned to do so.
- Prioritize findings by severity: critical, high, medium, low.
- Explain the affected file and the reason for each finding.
- Do not approve functionality that has not been verified.
- Return a clear APPROVED or CHANGES_REQUIRED verdict.
`,
    });
}
