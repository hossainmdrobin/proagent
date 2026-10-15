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
        console.log("USEEEEER FROM SINGLE POJECT", user)

        if (!user?.id || !mongoose.isValidObjectId(user.id)) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }
        const { projectId } = await params;
        console.log(projectId, "FORM THE USERER SINSLAS PROEFLKADST");
        const project = await Project.findById(projectId)
        console.log(project);
        return NextResponse.json(project, { status: 200 });
    } catch (error) {
        console.error("[Get Conversation API]", error);

        return NextResponse.json(
            { error: "Unable to retrieve conversation" },
            { status: 500 },
        );
    }
}