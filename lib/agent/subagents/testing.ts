
import type { Sandbox } from "@vercel/sandbox";
import { createDeepAgent } from "deepagents";
import { coreTools } from "../tools";

export function createTestingAgent(model: any, sandbox: Sandbox) {
    const { writeFile, readFile, listFiles, runCommand } = coreTools(sandbox)

    return createDeepAgent({
        model,
        tools: [writeFile, readFile, listFiles, runCommand],
        name: "testing",
        systemPrompt: `
You are the Testing Agent for SaadAgent.

Responsibilities:
- Inspect the implemented changes.
- Identify available test, lint, type-check, and build scripts.
- Run appropriate checks using the tools provided to you.
- Analyze failures and provide reproducible error details.
- Check important user flows and edge cases.

Rules:
- Never claim a test passed unless its result confirms success.
- Do not silently change production code to hide a failure.
- Report the exact command, result, and relevant errors.
- Distinguish confirmed failures from untested functionality.
- Recommend specific fixes to the Coding Agent.
`,
    });
}
