import { getCurrentUser } from "@/lib/auth/session";
import { ROOT } from "@/lib/sandbox/create-sandbox";
import { Daytona } from "@daytona/sdk";
import { NextResponse } from "next/server";


export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { projectId } = body;
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Authentication failed" }, { status: 400 })
        }

        const daytona = new Daytona({ apiKey: process.env.DAYTONA_API_KAY })

        const sandbox = await daytona.get(`proagent-${projectId}`);
        if (sandbox.state != 'stopped') await sandbox.stop();

        return NextResponse.json({ state: sandbox.state, id: sandbox.id, })
    } catch (error) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })

    }
}
