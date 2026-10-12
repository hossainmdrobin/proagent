
import { NextResponse } from "next/server";
import { createProjectAgent } from "@/lib/agent/create-agent";
import { createSandbox } from "@/lib/sandbox/create-sandbox";
import {
  persistSandboxWorkspace,
  restoreSandboxWorkspace,
} from "@/lib/workspace/sandbox-workspace";
import { getCurrentUser } from "@/lib/auth/session";

// Replace this import with your actual server-side session helper.

export const runtime = "nodejs";
export const maxDuration = 60;

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

export async function POST(
  request: Request,
  { params }: RouteContext,
) {
  let sandbox: Awaited<ReturnType<typeof createSandbox>> | undefined;

  try {
    // 1. Authenticate the request.
    const user = await getCurrentUser();

    if (!user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 },
      );
    }

    // 2. Validate request input.
    const { projectId } = await params;

    if (!/^[a-f\d]{24}$/i.test(projectId)) {
      return NextResponse.json(
        { error: "Invalid project ID" },
        { status: 400 },
      );
    }

    const body: unknown = await request.json();

    if (
      !body ||
      typeof body !== "object" ||
      !("prompt" in body) ||
      typeof body.prompt !== "string"
    ) {
      return NextResponse.json(
        { error: "A prompt is required" },
        { status: 400 },
      );
    }

    const prompt = body.prompt.trim();

    if (!prompt || prompt.length > 10_000) {
      return NextResponse.json(
        { error: "Prompt must be 1–10000 characters" },
        { status: 400 },
      );
    }

    // 3. Create a fresh, isolated sandbox.
    sandbox = await createSandbox();

    // 4. Restore the latest version.
    // Ownership must be checked inside this function, or by
    // an ownership check before restoring any project files.
    const restored = await restoreSandboxWorkspace({
      sandbox,
      projectId,
      ownerId: user.id,
    });

    // 5. Invoke your existing coding agent.
    const agent = createProjectAgent(sandbox);

    const result = await agent.invoke({
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
    });

    // 6. Save as a new snapshot only after agent invocation succeeds.
    const saved = await persistSandboxWorkspace({
      sandbox,
      projectId,
      ownerId: user.id,
      expectedVersion: restored.version,
    });

    return NextResponse.json({
      success: true,
      projectId,
      version: saved.version,
      message: "Project updated successfully",
      // Add the agent response here if your UI needs it.
    });
  } catch (error) {
    console.error("[Project Edit API]", error);

    return NextResponse.json(
      { error: "Unable to edit project" },
      { status: 500 },
    );
  } finally {
    if (sandbox) {
      try {
        await sandbox.stop();
      } catch (error) {
        console.error("[Sandbox Cleanup]", error);
      }
    }
  }
}
