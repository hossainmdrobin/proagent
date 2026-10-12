import { requireUser } from '@/lib/auth/session';
import { Project } from '@/lib/models/Project';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
    try {
        const user = await requireUser();
        const projects = await Project.find({ ownerId: user.id })
        return NextResponse.json(projects, { status: 200 });
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Something went wrong";
        return NextResponse.json(
            {
                error: "Internal Server Error",
                message: errorMessage
            },
            { status: 500 }
        );

    }

}