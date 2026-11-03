import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { Project } from "@/lib/models/Project";
import { getCurrentUser } from "@/lib/auth/session";
import { Conversation } from "@/lib/models/Conversaion";

export const runtime = "nodejs";

type RouteContext = {
    params: Promise<{
        projectId: string;
        conversationId: string;
    }>;
};

export async function GET(
    _request: Request,
    { params }: RouteContext,
) {
    try {
        const user = await getCurrentUser();

        if (!user?.id || !mongoose.isValidObjectId(user.id)) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 },
            );
        }

        const { projectId, conversationId } = await params;

        if (
            !mongoose.isValidObjectId(projectId) ||
            !mongoose.isValidObjectId(conversationId)
        ) {
            return NextResponse.json(
                { error: "Invalid project or conversation ID" },
                { status: 400 },
            );
        }

        await connectToDatabase();

        const project = await Project.findOne({
            _id: projectId,
            ownerId: user.id,
        }).select("_id");

        if (!project) {
            return NextResponse.json(
                { error: "Project not found" },
                { status: 404 },
            );
        }

        const conversation = await Conversation.findOne({
            _id: conversationId,
            projectId: project._id,
            ownerId: user.id,
        }).lean();

        if (!conversation) {
            return NextResponse.json(
                { error: "Conversation not found" },
                { status: 404 },
            );
        }

        return NextResponse.json({
            conversation: {
                id: conversation._id.toString(),
                projectId: conversation.projectId.toString(),
                title: conversation.title,
                messages: conversation.messages,
                createdAt: conversation.createdAt,
                updatedAt: conversation.updatedAt,
            },
        });
    } catch (error) {
        console.error("[Get Conversation API]", error);

        return NextResponse.json(
            { error: "Unable to retrieve conversation" },
            { status: 500 },
        );
    }
}