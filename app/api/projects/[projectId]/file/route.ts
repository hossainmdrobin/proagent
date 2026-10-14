import { ProjectFile } from '@/lib/models/ProjectFile';
import { ProjectSnapshot } from '@/lib/models/ProjectSnapshot';
import { NextRequest, NextResponse } from 'next/server';
import { Types } from 'mongoose';

type RouteContext = {
    params: Promise<{ projectId: string }>;
};

async function getOrCreateSnapshot(projectId: string) {
    const projectObjectId = new Types.ObjectId(projectId);
    let snapshot = await ProjectSnapshot.findOne({ projectId: projectObjectId }).sort({ version: -1 });
    if (!snapshot) {
        snapshot = await ProjectSnapshot.create({
            projectId: projectObjectId,
            version: 1,
            status: "complete",
            fileCount: 0,
            totalBytes: 0,
        });
    }
    return snapshot;
}

function successResponse(data: unknown, status = 200) {
    return NextResponse.json({ success: true, data }, { status });
}

function errorResponse(message: string, status = 500, code = "REQUEST_FAILED") {
    return NextResponse.json({ success: false, error: { code, message } }, { status });
}

export async function GET(
    request: NextRequest,
    context: RouteContext
) {
    const { projectId } = await context.params;
    try {
        const files = await ProjectFile.find({ projectId: projectId })
        return successResponse(files)

    } catch (error) {
        console.log(error)
        return errorResponse("Internal server error")
    }
}

export async function POST(
    request: NextRequest,
    context: RouteContext
) {
    const { projectId } = await context.params;
    try {
        const body = await request.json();
        console.log(body)
        const { path, content } = body;

        if (!path || content === undefined) {
            return errorResponse("Missing required fields", 400, "VALIDATION_ERROR");
        }
        console.log("LOOKING FOR SMAPSHORT");
        const snapshot = await getOrCreateSnapshot(projectId);
        const sizeBytes = Buffer.byteLength(content, 'utf8');
        console.log('CREATING FILES')
        const file = await ProjectFile.create({
            projectId: new Types.ObjectId(projectId),
            snapshotId: snapshot._id,
            path,
            content,
            sizeBytes,
        });
        console.log("CREATED FILE:",file)

        // Update snapshot file count and total bytes
        console.log('UPDATING SNAPSHOT')
        await ProjectSnapshot.findByIdAndUpdate(snapshot._id, {
            $inc: { fileCount: 1, totalBytes: sizeBytes },
        });

        return successResponse(file, 201);
    } catch (error) {
        console.log(error);
        return errorResponse("Internal server error");
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
            return errorResponse("Missing required fields", 400, "VALIDATION_ERROR");
        }

        const sizeBytes = Buffer.byteLength(content, 'utf8');
        
        const file = await ProjectFile.findOneAndUpdate(
            { _id: fileId, projectId: projectId },
            { path, content, sizeBytes },
            { new: true }
        );

        if (!file) {
            return errorResponse("File not found", 404, "NOT_FOUND");
        }

        return successResponse(file);
    } catch (error) {
        console.log(error);
        return errorResponse("Internal server error");
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
            return errorResponse("Missing fileId parameter", 400, "VALIDATION_ERROR");
        }

        const file = await ProjectFile.findOneAndDelete({
            _id: fileId,
            projectId: projectId,
        });

        if (!file) {
            return errorResponse("File not found", 404, "NOT_FOUND");
        }

        // Update snapshot
        await ProjectSnapshot.findByIdAndUpdate(file.snapshotId, {
            $inc: { fileCount: -1, totalBytes: -file.sizeBytes },
        });

        return successResponse({ success: true });
    } catch (error) {
        console.log(error);
        return errorResponse("Internal server error");
    }
}

