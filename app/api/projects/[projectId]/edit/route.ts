
import { NextResponse } from "next/server";
import { createProjectAgent } from "@/lib/agent/create-agent";
import { createSandbox } from "@/lib/sandbox/create-sandbox";
import {
  persistSandboxWorkspace,
  restoreSandboxWorkspace,
} from "@/lib/workspace/sandbox-workspace";
import { getCurrentUser } from "@/lib/auth/session";
import { AgentEvent } from "@/lib/agent/events";
import { AIMessage, BaseMessage } from "@langchain/core/messages";
import { validateProject } from "@/lib/workspace/validate-project";
import { Conversation } from "@/lib/models/Conversaion";
import { connectToDatabase } from "@/lib/db";
import type { ConversationMessage } from "@/lib/models/Conversaion";
import { initializeViteProject } from "@/lib/workspace/initialize-vite-project";

export const runtime = "nodejs";
export const maxDuration = 300;

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

type BodyType = { prompt: string, conversationId: string }

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

    const body: BodyType = await request.json();

    if (!body || typeof body !== "object" || !("prompt" in body) || typeof body.prompt !== "string")
      return NextResponse.json({ error: "A prompt is required" }, { status: 400 },);
    console.log("VALIDATING PROMPT")
    const prompt = body.prompt.trim();
    if (!prompt || prompt.length > 10000)
      return NextResponse.json({ error: "Prompt must be 1-10000 characters" }, { status: 400 },);
    console.log('CREATING SANDBOX')


    // SAVING THE MESSAGE PROMPT
    await connectToDatabase();

    const conversation = await Conversation.findOne({
      _id: body.conversationId,
      projectId,
      ownerId: user.id,
    });

    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 },
      );
    }
    conversation.messages.push({
      role: "user",
      content: prompt,
      createdAt: new Date(),
    });

    await conversation.save();


    // 3. Create a fresh, isolated sandbox.
    sandbox = await createSandbox(projectId);    // CREATE SANDBOX
    const publicUrl = sandbox.getSignedPreviewUrl(3001);
    console.log("CREATED PUBLUC URL:", publicUrl);
    console.log('RESTORING THE PROJECT')

    const restored = await restoreSandboxWorkspace({ sandbox, projectId, ownerId: user.id, });
    console.log('CREATING PROJECT AGENT')

    let expectedVersion = restored.version;

    // Initialize only a new project with no saved files.
    if (
      restored.version === 0 &&
      restored.restoredFileCount === 0
    ) {
      console.log("INITIALIZING NEW VITE PROJECT");

      await initializeViteProject(sandbox);

      const starterSaved = await persistSandboxWorkspace({
        sandbox,
        projectId,
        ownerId: user.id,
        expectedVersion,
      });

      expectedVersion = starterSaved.version;

      console.log("VITE STARTER SAVED:", starterSaved);
    }

    // 5. Invoke your existing coding agent.
    const agent = createProjectAgent(sandbox, projectId);
    console.log('STREAMING');

    const history = conversation.messages.map(
      (message: ConversationMessage, index: number, messages: ConversationMessage[]) => ({
        role: message.role,
        content:
          index === messages.length - 1 && message.role === "user"
            ? [
              "Modify the existing project to satisfy this request:",
              message.content,
              "",
              "Preserve unrelated existing functionality.",
              "Do not claim tests passed unless you ran them.",
            ].join("\n")
            : message.content,
      }));
    const agentStartedAt = Date.now();
    const stream = await agent.stream(
      { messages: history },
      {
        streamMode: 'updates',
        configurable: {
          thread_id: `project-${projectId}-chat-${body.conversationId}`,
        }
      });


    // THE ASSISTANT MESSAGE VARIABLE
    let assistantResponse = "";
    const readable = new ReadableStream({
      async start(controller) {
        try {
          controller.enqueue(encode({ type: "thinking" }))
          for await (const chunk of stream) {
            console.log(
              "AGENT STREAM DURATION (seconds):",
              ((Date.now() - agentStartedAt) / 1000).toFixed(1),
            );
            if (chunk.model_request) {
              const messages = chunk.model_request.messages;

              console.log(
                "MODEL UPDATE:",
                messages.map((message) => ({
                  type: message.getType(),
                  content: typeof message.content === "string"
                    ? message.content.slice(0, 200)
                    : "[non-string content]",
                  toolCalls: message instanceof AIMessage
                    ? message.tool_calls?.map((call) => call.name)
                    : [],
                })),
              );

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
                  // Only capture an AI message with no tool calls as a final-answer candidate.
                  if (message.tool_calls?.length === 0) {
                    assistantResponse = message.content;
                  }

                  controller.enqueue(
                    encode({ type: "message", content: message.content })
                  );
                }
              }
            }
            if (chunk.tools) {
              for (const message of chunk.tools.messages) {
                controller.enqueue(encode({ type: "tool_result", tool: message.name ?? "unknown", result: message.content }))
              }
            }
          }
          console.log(
            "AGENT STREAM DURATION (seconds):",
            ((Date.now() - agentStartedAt) / 1000).toFixed(1),
          );


          if (!assistantResponse.trim()) {
            throw new Error("Agent completed without a final assistant response");
          }

          // 1. Validate the completed project.
          controller.enqueue(
            encode({ type: "message", content: "Validating project..." }),
          );
          const validationStartedAt = Date.now();

          const validation = await validateProject(sandbox!);
          console.log(
            "VALIDATION DURATION (seconds):",
            ((Date.now() - validationStartedAt) / 1000).toFixed(1),
          );

          if (!validation.passed) {
            controller.enqueue(
              encode({
                type: "error",
                message: "Project validation failed. The snapshot was not saved.",
              }),
            );

            controller.close();
            return;
          }

          // 2. Persist only after validation succeeds.
          console.log("PERSISTING THE SANDBOX");

          const saved = await persistSandboxWorkspace({
            sandbox: sandbox!,
            projectId,
            ownerId: user.id,
            expectedVersion,
          });

          console.log("SANDBOX PERSISTED:", saved);

          // 3. Save the assistant response to MongoDB.
          const result = await Conversation.updateOne(
            {
              _id: body.conversationId,
              projectId,
              ownerId: user.id,
            },
            {
              $push: {
                messages: {
                  role: "assistant",
                  content: assistantResponse,
                  createdAt: new Date(),
                },
              },
              $set: {
                updatedAt: new Date(),
              },
            },
          );

          if (result.matchedCount !== 1) {
            throw new Error("Conversation was not found during message persistence");
          }

          // 4. Mark completion only after persistence succeeds.
          controller.enqueue(encode({ type: "done" }));
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
}
