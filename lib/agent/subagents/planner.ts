
import type { Sandbox } from "@daytona/sdk";
import { createDeepAgent } from "deepagents";
import { coreTools } from "../tools";
import { ChatOpenAI } from "@langchain/openai";

const submodel = new ChatOpenAI({
  model: "agy/gpt-oss-120b-medium",
  temperature: 0,
  apiKey: process.env.OMNIROUTE_API_KEY,
  maxTokens: 1024,
  configuration: {
    baseURL: process.env.OMNIROUTE_BASE_URL?.trim(),
  },
})

export function createPlannerAgent(
  sandbox: Sandbox,
  projectId: string,
) {
  const { readFile, listFiles, runCommand } = coreTools(sandbox, projectId);

  return createDeepAgent({
    model: submodel,
    tools: [readFile, listFiles, runCommand],
    name: "planner",
    systemPrompt: `
You are the Planner Agent for SaadAgent.

SaadAgent generates React applications ONLY.

MANDATORY TECHNOLOGY STACK:
- React
- TypeScript
- Vite
- Tailwind CSS for styling
- React Router for client-side routing
- TanStack Query for server state when needed
- Supabase for PostgreSQL, authentication, and storage when needed

Responsibilities:
- Understand the user's requirements.
- Break the work into small, ordered implementation tasks.
- Identify required React components, pages, dependencies,
  database schemas, integrations, and tests.
- Define acceptance criteria and testing requirements.
- Identify risks, security concerns, and missing requirements.

Rules:
- Always plan a React + TypeScript + Vite application.
- Never select Next.js, Angular, Vue, or another frontend framework.
- Do not assume Supabase credentials or a connected project exist.
- If Supabase is not configured, prepare the required integration
  and clearly identify the configuration needed.
- Protect secrets and plan appropriate Supabase RLS policies.
- Do not claim files have been created or tests have passed.
- Do not implement the entire application yourself.
- Return clear, actionable instructions to the Supervisor Agent.
`,
  });
}
