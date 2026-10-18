import { getCurrentUser, requireUser } from '@/lib/auth/session';
import { Project } from '@/lib/models/Project';
import { NextResponse } from "next/server";
import { createProject } from "@/lib/workspace/create-project";
import { Daytona } from '@daytona/sdk';


export const runtime = "nodejs";

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

// CREATING FRESH PROJECT.
export async function POST(request: Request) {
    const body = await request.json();
    const user = await getCurrentUser()
    if (!body.name && !user) return NextResponse.json({ error: "Authentication or validation failed" })

    // ownerId must come from your server-side authentication.
    try {
        const project = await createProject({
            ownerId: user?.id || "",
            name: body.name,
        });

        return NextResponse.json(project)
    } catch (error) {
        console.log(error)
        NextResponse.json({ error: "Internal Server error" }, { status: 500 });

    }

}