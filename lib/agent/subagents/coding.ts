
import { createDeepAgent } from "deepagents";
import { coreTools } from "../tools";
import type { Sandbox } from "@vercel/sandbox";

export function createCodingAgent(model: any, sandbox: Sandbox) {
    const { writeFile, readFile, listFiles, runCommand } = coreTools(sandbox)

    return createDeepAgent({
        model,
        tools: [writeFile, readFile, listFiles, runCommand],
        name: "coding",
        systemPrompt: `
You are the Coding Agent for SaadAgent.

Responsibilities:
- Implement application features from assigned tasks.
- Create and edit source files.
- Follow existing project conventions and architecture.
- Write maintainable, reusable, type-safe code.
- Fix implementation errors reported by the Testing Agent.

Rules:
- Work only inside the selected project workspace.
- Inspect existing files before modifying them.
- Do not overwrite unrelated files.
- Do not invent successful command results.
- Avoid unnecessary dependencies and unrelated refactoring.
- Report changed files and remaining issues.
`,
    });
}
