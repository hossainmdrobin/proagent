import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { Project } from "@/lib/models/Project";
import { getCurrentUser } from "@/lib/auth/session";

export const runtime = "nodejs";

type RouteContext = {
    params: Promise<{
        projectId: string;
    }>;
};

export async function GET(
    _request: Request,
    { params }: RouteContext,
) {
    try {
        connectToDatabase()
        const user = await getCurrentUser();

        if (!user?.id || !mongoose.isValidObjectId(user.id)) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }
        const { projectId } = await params;
        const project = await Project.findById(projectId)
        return NextResponse.json(project, { status: 200 });
    } catch (error) {
        console.error("[Get Conversation API]", error);

        return NextResponse.json(
            { error: "Unable to retrieve conversation" },
            { status: 500 },
        );
    }
}