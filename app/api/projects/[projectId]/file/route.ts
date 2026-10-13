import { ProjectFile } from '@/lib/models/ProjectFile';
import { NextRequest, NextResponse } from 'next/server';

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