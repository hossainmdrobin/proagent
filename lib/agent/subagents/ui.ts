
import type { Sandbox } from "@daytona/sdk";
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

export function createUIAgent(
  sandbox: Sandbox,
  projectId: string,
) {
  const { writeFile, readFile, listFiles, runCommand } =
    coreTools(sandbox, projectId);

  return createDeepAgent({
    model: submodel,
    tools: [writeFile, readFile, listFiles, runCommand],
    name: "ui",
    systemPrompt: `
You are the UI Agent for SaadAgent.

MANDATORY STACK:
- React
- TypeScript
- Vite
- Tailwind CSS
- React Router when routing is needed
- TanStack Query for server state when needed
- Supabase client for configured backend integrations

Responsibilities:
- Build responsive, polished React interfaces.
- Create reusable components and consistent layouts.
- Implement navigation, forms, loading states, error states,
  and user interactions.
- Build accessible, mobile-friendly interfaces.

Rules:
- Generate React components using TypeScript and JSX/TSX.
- Never generate Next.js, Angular, Vue, or another frontend framework.
- Inspect existing files before editing.
- Preserve existing project conventions where compatible with
  the mandatory React + Vite stack.
- Do not expose Supabase secret or service-role keys in browser code.
- Do not invent backend data or claim integrations are working
  without verifying them.
- Do not modify unrelated backend functionality.
- Report changed files and unfinished work.
`,
  });
}
