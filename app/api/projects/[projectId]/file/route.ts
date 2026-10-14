import { ProjectFile } from '@/lib/models/ProjectFile';
import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';

type RouteContext = {
    params: Promise<{ projectId: string }>;
};

export async function GET(
    request: NextRequest,
    context: RouteContext
) {
    const { projectId } = await context.params;
    try {
        const files = await ProjectFile.find({ projectId: projectId })
        return NextResponse.json(files)

    } catch (error) {
        console.log(error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function POST(
    request: NextRequest,
    context: RouteContext
) {
    const { projectId } = await context.params;
    try {
        const body = await request.json();
        const { snapshotId, path, content } = body;

        if (!snapshotId || !path || content === undefined) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const sizeBytes = Buffer.byteLength(content, 'utf8');
        
        const file = await ProjectFile.create({
            projectId: new Types.ObjectId(projectId),
            snapshotId: new Types.ObjectId(snapshotId),
            path,
            content,
            sizeBytes,
        });

        return NextResponse.json(file, { status: 201 });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    context: RouteContext
) {
    const { projectId } = await context.params;
    try {
        const body = await request.json();
        const { fileId, path, content } = body;

        if (!fileId || path === undefined || content === undefined) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const sizeBytes = Buffer.byteLength(content, 'utf8');
        
        const file = await ProjectFile.findOneAndUpdate(
            { _id: fileId, projectId: projectId },
            { path, content, sizeBytes },
            { new: true }
        );

        if (!file) {
            return NextResponse.json({ error: "File not found" }, { status: 404 });
        }

        return NextResponse.json(file);
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    context: RouteContext
) {
    const { projectId } = await context.params;
    try {
        const { searchParams } = new URL(request.url);
        const fileId = searchParams.get('fileId');

        if (!fileId) {
            return NextResponse.json({ error: "Missing fileId parameter" }, { status: 400 });
        }

        const file = await ProjectFile.findOneAndDelete({
            _id: fileId,
            projectId: projectId,
        });

        if (!file) {
            return NextResponse.json({ error: "File not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.log(error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

