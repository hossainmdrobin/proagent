
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { Project } from "@/lib/models/Project";
import { createSandbox } from "@/lib/sandbox/create-sandbox";
import { restoreSandboxWorkspace } from "@/lib/workspace/sandbox-workspace";

export const runtime = "nodejs";
export const maxDuration = 60;

type RouteContext = {
    params: Promise<{ projectId: string }>;
};

const ROOT = "/vercel/sandbox/project";

export async function POST(
    _request: Request,
    { params }: RouteContext,
) {
    try {
        await connectToDatabase();

        const user = await getCurrentUser();

        if (!user?.id || !mongoose.isValidObjectId(user.id)) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        const { projectId } = await params;

        if (!mongoose.isValidObjectId(projectId)) {
            return NextResponse.json(
                { error: "Invalid project ID" },
                { status: 400 },
            );
        }

        const project = await Project.findOne({
            _id: projectId,
            ownerId: user.id,
        });

        if (!project) {
            return NextResponse.json(
                { error: "Project not found" },
                { status: 404 },
            );
        }

        const sandbox = await createSandbox(projectId);
        const previewUrl = sandbox.domain(3001);

        // Reuse an already-running preview.
        try {
            const response = await fetch(previewUrl, {
                signal: AbortSignal.timeout(2_000),
            });

            if (response.ok) {
                await Project.updateOne(
                    { _id: projectId, ownerId: user.id },
                    {
                        $set: {
                            previewUrl,
                            previewStatus: "ready",
                        },
                    },
                );

                return NextResponse.json({
                    status: "ready",
                    previewUrl,
                });
            }
        } catch {
            // Preview is not responding yet.
        }

        // Avoid starting a second server while the existing command
        // is still installing dependencies or starting up.
        if (project.previewCommandId) {
            try {
                const existingCommand = await sandbox.getCommand(
                    project.previewCommandId,
                );

                if (existingCommand && existingCommand.exitCode == null) {
                    await Project.updateOne(
                        { _id: projectId, ownerId: user.id },
                        {
                            $set: {
                                previewUrl,
                                previewStatus: "starting",
                            },
                        },
                    );

                    return NextResponse.json({
                        status: "starting",
                        previewUrl,
                        commandId: project.previewCommandId,
                    });
                }
            } catch {
                // The saved command no longer exists; start a new one.
            }
        }

        // Restore the latest saved project files before starting it.
        await restoreSandboxWorkspace({
            sandbox,
            projectId,
            ownerId: user.id,
        });

        // Check that the restored project has a package.json.
        const packageCheck = await sandbox.runCommand({
            cmd: "test",
            args: ["-f", `${ROOT}/package.json`],
            cwd: ROOT,
        });

        if (packageCheck.exitCode !== 0) {
            await Project.updateOne(
                { _id: projectId, ownerId: user.id },
                {
                    $set: {
                        previewStatus: "failed",
                        previewUrl: null,
                        previewCommandId: null,
                    },
                },
            );

            return NextResponse.json(
                {
                    error: "This project has no package.json. Create or restore a runnable project first.",
                },
                { status: 422 },
            );
        }

        await Project.updateOne(
            { _id: projectId, ownerId: user.id },
            {
                $set: {
                    previewUrl,
                    previewStatus: "starting",
                },
            },
        );

        // Install dependencies, then start the development server.
        const command = await sandbox.runCommand({
            cmd: "sh",
            args: [
                "-lc",
                "npm install && npm run dev -- --host 0.0.0.0 --port 3001",
            ],
            cwd: ROOT,
            detached: true,
        });

        await Project.updateOne(
            { _id: projectId, ownerId: user.id },
            {
                $set: {
                    previewCommandId: command.cmdId,
                    previewUrl,
                    previewStatus: "starting",
                },
            },
        );

        return NextResponse.json({
            status: "starting",
            previewUrl,
            commandId: command.cmdId,
        });
    } catch (error) {
        console.error("[Project Preview API]", error);

        return NextResponse.json(
            { error: "Unable to start project preview" },
            { status: 500 },
        );
    }
}
