import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { Project } from "@/lib/models/Project";
import { getCurrentUser } from "@/lib/auth/session";
import { Conversation } from "@/lib/models/Conversaion";

export const runtime = "nodejs";

type RouteContext = {
    params: Promise<{ projectId: string }>;
};

export async function POST(
    request: NextRequest,
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

        const { projectId } = await params;

        if (!mongoose.isValidObjectId(projectId)) {
            return NextResponse.json(
                { error: "Invalid project ID" },
                { status: 400 },
            );
        }

        const body: unknown = await request.json().catch(() => null);

        if (
            !body ||
            typeof body !== "object" ||
            !("title" in body) ||
            (body.title !== undefined && typeof body.title !== "string")
        ) {
            return NextResponse.json(
                { error: "Invalid conversation data" },
                { status: 400 },
            );
        }

        const title = (body.title as string | undefined)?.trim() || "New chat";

        if (title.length > 120) {
            return NextResponse.json(
                { error: "Title must be at most 120 characters" },
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

        const conversation = await Conversation.create({
            ownerId: new mongoose.Types.ObjectId(user.id),
            projectId: project._id,
            title,
            messages: [],
        });

        return NextResponse.json(
            {
                conversation: {
                    id: conversation._id.toString(),
                    projectId: conversation.projectId.toString(),
                    title: conversation.title,
                    messages: conversation.messages,
                    createdAt: conversation.createdAt,
                    updatedAt: conversation.updatedAt,
                },
            },
            { status: 201 },
        );
    } catch (error) {
        console.error("[Create Conversation API]", error);

        return NextResponse.json(
            { error: "Unable to create conversation" },
            { status: 500 },
        );
    }
}

export async function GET(
    _request: NextRequest,
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

        const { projectId } = await params;

        if (!mongoose.isValidObjectId(projectId)) {
            return NextResponse.json(
                { error: "Invalid project ID" },
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

        const conversations = await Conversation.find({
            ownerId: user.id,
            projectId: project._id,
        })
            .select("title messages createdAt updatedAt")
            .sort({ updatedAt: -1 })
            .limit(100)
            .lean();

        return NextResponse.json({
            conversations: conversations.map((conversation) => ({
                id: conversation._id.toString(),
                title: conversation.title,
                messages: conversation.messages,
                createdAt: conversation.createdAt,
                updatedAt: conversation.updatedAt,
            })),
        });
    } catch (error) {
        console.error("[List Conversations API]", error);

        return NextResponse.json(
            { error: "Unable to retrieve conversations" },
            { status: 500 },
        );
    }
}