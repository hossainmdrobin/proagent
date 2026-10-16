
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { Project } from "@/lib/models/Project";
import { createSandbox } from "@/lib/sandbox/create-sandbox";

export const runtime = "nodejs";
export const maxDuration = 60;

type RouteContext = {
    params: Promise<{ projectId: string }>;
};

const ROOT = "/vercel/sandbox/project";

export async function GET(
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

        if (!project.previewUrl) {
            return NextResponse.json({
                status: project.previewStatus || "stopped",
                previewUrl: null,
            });
        }

        // Check whether the preview server is responding.
        try {
            const response = await fetch(project.previewUrl, {
                signal: AbortSignal.timeout(2_000),
                cache: "no-store",
            });

            if (response.ok) {
                await Project.updateOne(
                    { _id: projectId, ownerId: user.id },
                    { $set: { previewStatus: "ready" } },
                );

                return NextResponse.json({
                    status: "ready",
                    previewUrl: project.previewUrl,
                });
            }
        } catch {
            // Preview may still be starting.
        }

        if (!project.previewCommandId) {
            return NextResponse.json({
                status: project.previewStatus || "stopped",
                previewUrl: project.previewUrl,
            });
        }

        const sandbox = await createSandbox(projectId);

        // Inspect the original preview command.

        let command;

        try {
            command = await sandbox.getCommand(
                project.previewCommandId,
            );
        } catch (error) {
            console.error("[Preview Command Lookup Failed]", error);

            await Project.updateOne(
                { _id: projectId, ownerId: user.id },
                {
                    $set: {
                        previewStatus: "failed",
                        previewCommandId: null,
                    },
                },
            );

            return NextResponse.json({
                status: "failed",
                previewUrl: project.previewUrl,
                error: "The previous sandbox command is no longer available. Restart the preview.",
            });
        }


        // TEMPORARY DIAGNOSTIC: inspect the sandbox environment.
        const diagnostic = await sandbox.runCommand({
            cmd: "sh",
            args: [
                "-lc",
                "pwd; node --version; npm --version; ls -la /vercel/sandbox/project; cat /vercel/sandbox/project/package.json",
            ],
            cwd: ROOT,
        });

        const diagnosticStdout = await diagnostic.stdout().catch(() => "");
        const diagnosticStderr = await diagnostic.stderr().catch(() => "");

        console.log("[Preview Diagnostic]", {
            originalCommandId: project.previewCommandId,
            originalExitCode: command.exitCode,
            diagnosticExitCode: diagnostic.exitCode,
            diagnosticStdout,
            diagnosticStderr,
        });

        const logs = await command.output("both").catch(() => "");

        if (command.exitCode === null) {
            return NextResponse.json({
                status: "starting",
                previewUrl: project.previewUrl,
                commandId: command.cmdId,
                exitCode: command.exitCode,
                logs: logs.slice(-6000),
            });
        }

        await Project.updateOne(
            { _id: projectId, ownerId: user.id },
            { $set: { previewStatus: "failed" } },
        );

        return NextResponse.json({
            status: "failed",
            previewUrl: project.previewUrl,
            commandId: command.cmdId,
            exitCode: command.exitCode,
            logs: logs.slice(-6000),
        });
    } catch (error) {
        console.error("[Preview Status API]", error);

        return NextResponse.json(
            { error: "Unable to check preview status" },
            { status: 500 },
        );
    }
}
