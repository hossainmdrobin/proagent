import { getCurrentUser } from "@/lib/auth/session";
import { ROOT } from "@/lib/sandbox/create-sandbox";
import { Daytona } from "@daytona/sdk";
import { NextResponse } from "next/server";
type RouteContext = {
    params: Promise<{ projectId: string }>;
};

const daytona = new Daytona({ apiKey: process.env.DAYTONA_API_KEY })
const port = process.env.DAYTONA_PROJECT_PORT!;


export async function GET(request: Request, { params }: RouteContext) {
    try {
        const { projectId } = await params;
        const sandbox = await daytona.get(`proagent-${projectId}`);
        if (sandbox.state != "started") {
            return NextResponse.json({ state: sandbox.state });
        }
        const signedUrl = await sandbox.getSignedPreviewUrl(Number(port), 3600);
        return NextResponse.json({ state: sandbox.state, ...signedUrl })
    } catch (error) {
        console.log(error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { projectId } = body;
        console.log("AUTHENTICATING USER")
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Authentication failed" }, { status: 400 })
        }
        console.log('DAYTONA INITIALIZING')

        const sandbox = await daytona.get(`proagent-${projectId}`);
        console.log("STARTING ...")
        if (sandbox.state != 'started') {
            await sandbox.start()
        } else {
            const signedUrl = await sandbox.getSignedPreviewUrl(Number(port), 3600);
            return NextResponse.json(signedUrl)
        }
        console.log('EXACUTING COMMAND')
        await sandbox.process.executeCommand(
            `nohup npm run dev -- --host 0.0.0.0 --port ${port} > server.log 2>&1 &`,
            ROOT
        );
        console.log('WAITING TO START',)
        await new Promise((resolve) => setTimeout(resolve, 5000));
        console.log("Getting PRewiew URL")
        const signedUrl = await sandbox.getSignedPreviewUrl(Number(port), 3600);
        return NextResponse.json(signedUrl)
    } catch (error) {
        console.log(error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })

    }
}
