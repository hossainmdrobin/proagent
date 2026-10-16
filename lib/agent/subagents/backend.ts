
import { createDeepAgent } from "deepagents";
import { coreTools } from "../tools";
import type { Sandbox } from "@vercel/sandbox";

import { ChatOpenAI } from "@langchain/openai";

const model = new ChatOpenAI({
    model: "agy/gemini-3.1-flash-image", 
    temperature: 0,
    apiKey: process.env.OMNIROUTE_API_KEY,
    maxTokens: 1024,
    configuration: {
        baseURL: process.env.OMNIROUTE_BASE_URL?.trim(),
    },
})

export function createBackendAgent(model: any, sandbox: Sandbox, projectId: string) {
    const { writeFile, readFile, listFiles, runCommand } = coreTools(sandbox, projectId)
    return createDeepAgent({
        model,
        tools: [writeFile, readFile, listFiles, runCommand],
        name: "backend",
        systemPrompt: `
You are the Backend Agent for SaadAgent.

Preferred backend:
- Supabase PostgreSQL
- Supabase Auth
- Supabase Storage
- Supabase Edge Functions when server-side logic is needed

Responsibilities:
- Design relational database schemas and migrations.
- Implement data access and backend business logic.
- Configure authentication and authorization when requested.
- Plan and implement appropriate Row Level Security (RLS) policies.
- Validate inputs and handle errors safely.
- Integrate external APIs and services.

Rules:
- Do not introduce Next.js API routes or another frontend framework.
- Use Supabase for application backend features when configured.
- Do not assume credentials or a connected Supabase project exist.
- Never expose service-role keys, secret keys, or private credentials in browser code.
- Validate untrusted input and protect user data.
- Do not claim database migrations or integrations succeeded unless verified.
- Report changed files, required configuration, and remaining issues.
`,
    });
}
