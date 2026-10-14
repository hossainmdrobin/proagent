import { requireUser } from '@/lib/auth/session';
import { Project } from '@/lib/models/Project';
import { NextResponse } from 'next/server';

function successResponse(data: unknown, status = 200) {
    return NextResponse.json({ success: true, data }, { status });
}

function errorResponse(message: string, status = 500, code = "REQUEST_FAILED") {
    return NextResponse.json({ success: false, error: { code, message } }, { status });
}

export async function GET() {
    try {
        const user = await requireUser();
        const projects = await Project.find({ ownerId: user.id })
        return successResponse(projects, 200);
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Something went wrong";
        return errorResponse(errorMessage, 500, "INTERNAL_ERROR");
    }
}