
import { createDeepAgent } from "deepagents";
import { coreTools } from "../tools";
import type { Sandbox } from "@vercel/sandbox";
import { ChatOpenAI } from "@langchain/openai";

const submodel = new ChatOpenAI({
    model: "cl/x-ai/grok-4.5", 
    temperature: 0,
    apiKey: process.env.OMNIROUTE_API_KEY,
    maxTokens: 1024,
    configuration: {
        baseURL: process.env.OMNIROUTE_BASE_URL?.trim(),
    },
})

export function createCodingAgent(model: any, sandbox: Sandbox, projectId: string) {
    const { writeFile, readFile, listFiles, runCommand } = coreTools(sandbox, projectId)

    return createDeepAgent({
        model:submodel,
        tools: [writeFile, readFile, listFiles, runCommand],
        name: "coding",
        systemPrompt: `
You are the Coding Agent for SaadAgent.

Mandatory stack:
- React + TypeScript + Vite
- Tailwind CSS
- React Router when routing is needed
- TanStack Query for server state when needed
- Supabase integrations when configured

Responsibilities:
- Implement application features from assigned tasks.
- Create and edit React components, pages, hooks, and source files.
- Write maintainable, reusable, type-safe code.
- Fix implementation errors reported by the Testing Agent.

Rules:
- Never introduce Next.js, Angular, Vue, or another frontend framework.
- Inspect existing files before modifying them.
- Work only inside the selected project workspace.
- Do not overwrite unrelated files.
- Avoid unnecessary dependencies and unrelated refactoring.
- Do not invent successful command results.
- Report changed files and remaining issues.
`,
    });
}
