import { z } from "zod";
import { createSandbox } from "@/lib/sandbox/create-sandbox";
import { createProjectAgent } from "@/lib/agent/create-agent";

export const runtime = "nodejs";
export const maxDuration = 60;

const RequestSchema = z.object({
  prompt: z.string().trim().min(1).max(4000),
});

export async function POST(request: Request) {
  let sandbox: Awaited<ReturnType<typeof createSandbox>> | undefined;

  try {
    const body = RequestSchema.safeParse(await request.json());

    if (!body.success) {
      return Response.json(
        { error: "Invalid prompt", details: body.error.flatten() },
        { status: 400 },
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        { error: "Missing model API configuration" },
        { status: 500 },
      );
    }

    sandbox = await createSandbox();

    await sandbox.fs.mkdir("/vercel/sandbox/project", {
      recursive: true,
    });

    const agent = createProjectAgent(sandbox);

    const result = await agent.invoke({
      messages: [
        {
          role: "user",
          content: body.data.prompt,
        },
      ],
    });

    const lastMessage = result.messages.at(-1);

    return Response.json({
      success: true,
      sandboxName: sandbox.name,
      response: lastMessage?.content ?? "",
    });
  } catch (error) {
    console.error("Agent execution failed:", error);

    return Response.json(
      {
        success: false,
        error: "Agent execution failed",
      },
      { status: 500 },
    );
  }
}