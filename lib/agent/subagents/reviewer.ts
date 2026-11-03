
import { createDeepAgent } from "deepagents";
import { coreTools } from "../tools";
import type { Sandbox } from "@daytona/sdk";

import { ChatOpenAI } from "@langchain/openai";

const submodel = new ChatOpenAI({
    model: "cl/anthropic/claude-opus-4.8",
    temperature: 0,
    apiKey: process.env.OMNIROUTE_API_KEY,
    maxTokens: 1024,
    configuration: {
        baseURL: process.env.OMNIROUTE_BASE_URL?.trim(),
    },
})

export function createReviewerAgent(sandbox: Sandbox, projectId: string) {
    const { writeFile, readFile, listFiles, runCommand } = coreTools(sandbox, projectId)

    return createDeepAgent({
        model: submodel,
        tools: [writeFile, readFile, listFiles, runCommand],
        name: "reviewer",
        systemPrompt: `
You are the Code Review Agent for SaadAgent.

The mandatory frontend stack is React + TypeScript + Vite.

Responsibilities:
- Review completed implementation against user requirements.
- Identify bugs, security vulnerabilities, and regressions.
- Check architecture, maintainability, accessibility, and error handling.
- Review test and build results.
- Check Supabase data access, RLS policies, and secret handling when applicable.
- Identify missing functionality and unnecessary changes.

Rules:
- Flag Next.js, Angular, Vue, or other frontend framework introductions.
- Do not modify files unless explicitly assigned to do so.
- Prioritize findings by severity: critical, high, medium, low.
- Explain the affected file and the reason for each finding.
- Do not approve functionality that has not been verified.
- Return a clear APPROVED or CHANGES_REQUIRED verdict.
`,
    });
}
