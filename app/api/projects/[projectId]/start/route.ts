import { getCurrentUser } from "@/lib/auth/session";
import { ROOT } from "@/lib/sandbox/create-sandbox";
import { Daytona } from "@daytona/sdk";
import { NextResponse } from "next/server";


export async function POST(request: Request) {
    try {
        const port = process.env.DAYTONA_PROJECT_PORT!;
        const body = await request.json();
        const { projectId } = body;
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Authentication failed" }, { status: 400 })
        }

        const daytona = new Daytona({ apiKey: process.env.DAYTONA_API_KAY })

        const sandbox = await daytona.get(`proagent-${projectId}`);
        if(sandbox.state != 'started') await sandbox.start()
        await sandbox.process.executeCommand(
            `nohup npm run dev -- --host 0.0.0.0 --port ${port} > server.log 2>&1 &`,
            ROOT
        );

        await new Promise((resolve) => setTimeout(resolve, 5000));

        const signedUrl = await sandbox.getSignedPreviewUrl(Number(port), 3600);
        return NextResponse.json({url:signedUrl,})
    } catch (error) {
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })

    }
}
