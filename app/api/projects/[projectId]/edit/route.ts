
import { NextResponse } from "next/server";
import { createProjectAgent } from "@/lib/agent/create-agent";
import { createSandbox } from "@/lib/sandbox/create-sandbox";
import {
  persistSandboxWorkspace,
  restoreSandboxWorkspace,
} from "@/lib/workspace/sandbox-workspace";
import { getCurrentUser } from "@/lib/auth/session";
import { threadId } from "worker_threads";
import { AgentEvent } from "@/lib/agent/events";
import { AIMessage, BaseMessage } from "langchain";
import { validateProject } from "@/lib/workspace/validate-project";

export const runtime = "nodejs";
export const maxDuration = 60;

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

function encode(event: AgentEvent) {
  return new TextEncoder().encode(
    JSON.stringify(event) + "\n"
  );
}

function isAIMessage(
  message: BaseMessage
): message is AIMessage {
  return message instanceof AIMessage;
}

export async function POST(
  request: Request,
  { params }: RouteContext,
) {
  let sandbox: Awaited<ReturnType<typeof createSandbox>> | undefined;

  try {
    console.log("AUTHENTICATING USER");
    // 1. Authenticate the request.
    const user = await getCurrentUser();
    if (!user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 },);
    console.log('VALIDATION PROJECT ID')
    // 2. Validate request input.
    const { projectId } = await params;
    if (!/^[a-f\d]{24}$/i.test(projectId))
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 },);

    const body: { prompt: string } = await request.json();
    if (!body || typeof body !== "object" || !("prompt" in body) || typeof body.prompt !== "string")
      return NextResponse.json({ error: "A prompt is required" }, { status: 400 },);
    console.log("VALIDATING PROMPT")
    const prompt = body.prompt.trim();
    if (!prompt || prompt.length > 10000)
      return NextResponse.json({ error: "Prompt must be 1-10000 characters" }, { status: 400 },);
    console.log('CREATING SANDBOX')
    // 3. Create a fresh, isolated sandbox.
    sandbox = await createSandbox(projectId);
    const publicUrl = sandbox.domain(3001);
    console.log("CREATED PUBLUC URL:", publicUrl);
    console.log('RESTORING THE PROJECT')

    const restored = await restoreSandboxWorkspace({ sandbox, projectId, ownerId: user.id, });
    console.log('CREATING PROJECT AGENT')

    // 5. Invoke your existing coding agent.
    const agent = createProjectAgent(sandbox);
    console.log('STREAMING');

    const stream = await agent.stream({
      messages: [
        {
          role: "user",
          content: [
            `Modify the existing project to satisfy this request:`,
            prompt,
            "",
            "Preserve unrelated existing functionality.",
            "Do not claim tests passed unless you ran them.",
          ].join("\n"),
        },
      ],
    }, {
      streamMode: 'updates',
      configurable: {
        thread_id: "your_tread_id"
      }
    });
    const readable = new ReadableStream({
      async start(controller) {
        try {
          controller.enqueue(encode({ type: "thinking" }))
          for await (const chunk of stream) {
            if (chunk.model_request) {
              const messages = chunk.model_request.messages;

              for (const message of messages) {
                if (!isAIMessage(message)) {
                  continue;
                }

                if (message.tool_calls?.length) {
                  for (const call of message.tool_calls) {
                    controller.enqueue(encode({ type: "tool_call", tool: call.name, args: call.args }))
                  }
                }
                if (typeof message.content === "string" && message.content) {
                  controller.enqueue(encode({ type: "message", content: message.content }))
                }
              }
            }
            if (chunk.tools) {
              for (const message of chunk.tools.messages) {
                controller.enqueue(encode({ type: "tool_result", tool: message.name ?? "unknown", result: message.content }))
              }
            }
          }
          controller.enqueue(encode({ type: "done" }))
          controller.close();

        } catch (error) {
          controller.enqueue(encode({
            type: "error",
            message: error instanceof Error ? error.message : "Unknown agent error"
          }))
          controller.close();

        }
      }
    })

    // VALIDATE THE PROJECT BEFOR SAVE
    const validation = await validateProject(sandbox);


    // 6. Save as a new snapshot only after agent invocation succeeds.
    console.log("PERSISTING THE SANDBOX");
    const saved = await persistSandboxWorkspace({
      sandbox,
      projectId,
      ownerId: user.id,
      expectedVersion: restored.version,
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "application/x-ndjson",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("[Project Edit API]", error);

    return NextResponse.json(
      { error: "Unable to edit project" },
      { status: 500 },
    );
  }
  // finally {
  //   if (sandbox) {
  //     try {
  //       await sandbox.stop();
  //     } catch (error) {
  //       console.error("[Sandbox Cleanup]", error);
  //     }
  //   }
  // }
}
