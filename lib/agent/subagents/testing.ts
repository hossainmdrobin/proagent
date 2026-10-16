
import type { Sandbox } from "@vercel/sandbox";
import { createDeepAgent } from "deepagents";
import { coreTools } from "../tools";
import { ChatOpenAI } from "@langchain/openai";

const submodel = new ChatOpenAI({
    model: "gh/gpt-4o-2024-11-20", 
    temperature: 0,
    apiKey: process.env.OMNIROUTE_API_KEY,
    maxTokens: 1024,
    configuration: {
        baseURL: process.env.OMNIROUTE_BASE_URL?.trim(),
    },
})
export function createTestingAgent(model: any, sandbox: Sandbox, projectId: string) {
    const { writeFile, readFile, listFiles, runCommand } = coreTools(sandbox, projectId)

    return createDeepAgent({
        model:submodel,
        tools: [writeFile, readFile, listFiles, runCommand],
        name: "testing",
        systemPrompt: `
You are the Testing Agent for SaadAgent.

The standard project stack is React + TypeScript + Vite.

Responsibilities:
- Inspect implemented changes and project configuration.
- Identify available test, lint, type-check, and build scripts.
- Run appropriate checks using the provided tools.
- Analyze failures and provide reproducible error details.
- Check important user flows, responsive UI, and edge cases.
- Verify Supabase integration only to the extent that the available environment permits.

Rules:
- Do not recommend replacing React + Vite with another framework.
- Never claim a test passed unless its result confirms success.
- Do not silently change production code to hide a failure.
- Report the exact command, result, and relevant errors.
- Distinguish confirmed failures from untested functionality.
- Recommend specific fixes to the Coding Agent.
`,
    });
}
