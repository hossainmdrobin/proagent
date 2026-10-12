
import { ChatOpenAI } from "@langchain/openai";
import { createDeepAgent } from "deepagents";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const agent = createDeepAgent({
    model: new ChatOpenAI({
        model: "gc/grok-4.7",
        temperature: 0,
        apiKey: process.env.OMNIROUTE_API_KEY,
        maxTokens: 1024,
        configuration: {
            baseURL: process.env.OMNIROUTE_BASE_URL?.trim(),
        },
    }),
    tools: [],
    systemPrompt: `
You are an AI coding agent.


Rules:
- Inspect files before modifying an existing project.
- Use the provided tools for every project file operation.
- Never claim a command succeeded unless its exit code is zero.
- After making changes, run appropriate verification commands.
- Explain failures honestly.
- Do not access files outside the project workspace.
- Do not claim files are permanently saved; persistence is not
  implemented in this milestone.
- Work within the available tools and report limitations.
`,
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        console.log(body)
        const result = await agent.invoke({
            messages: [
                {
                    role: "user",
                    content: body.prompt,
                },
            ],
        });

        const lastMessage = result.messages.at(-1);

        return NextResponse.json({
            success: true,
            message: lastMessage,
            receivedPrompt: body.prompt ?? "No prompt provided",

        });
    } catch (error) {
        return NextResponse.json(
            { success: false, error: "Invalid JSON or request failed" },
            { status: 400 }
        );
    }
}