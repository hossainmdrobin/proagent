
import { ChatOpenAI } from "@langchain/openai";
import { createDeepAgent } from "deepagents";
import { NextResponse } from "next/server";
import { createSandbox } from "@/lib/sandbox/create-sandbox";
import { createProject } from "@/lib/workspace/create-project";
import {
    persistSandboxWorkspace,
    restoreSandboxWorkspace,
} from "@/lib/workspace/sandbox-workspace";

export const runtime = "nodejs";


export async function POST(request: Request) {
    const ownerId = "6acd0caaa85a2a19e264e3d3"
    // ownerId must come from your server-side authentication.
    const project = await createProject({
        ownerId,
        name: ("Project" + Math.random()*1000).slice(0,10),
    });

    const firstSandbox = await createSandbox();

    try {
        await firstSandbox.fs.mkdir(
            "/vercel/sandbox/project",
            { recursive: true },
        );

        await firstSandbox.fs.writeFile(
            "/vercel/sandbox/project/hello.js",
            'console.log("Persistence works");',
        );

        const saved = await persistSandboxWorkspace({
            sandbox: firstSandbox,
            projectId: project.id,
            ownerId,
            expectedVersion: 0,
        });

        if (saved.version !== 1) {
            throw new Error("Unexpected saved version");
        }
    } finally {
        await firstSandbox.stop();
    }

    // A new sandbox must be able to reconstruct the project.
    const secondSandbox = await createSandbox();

    try {
        const restored = await restoreSandboxWorkspace({
            sandbox: secondSandbox,
            projectId: project.id,
            ownerId,
        });

        const contents = await secondSandbox.fs.readFile(
            "/vercel/sandbox/project/hello.js",
            "utf8",
        );

        if (contents !== 'console.log("Persistence works");') {
            throw new Error("Restored content does not match");
        }

        console.log({
            savedVersion: 1,
            restoredVersion: restored.version,
            contents,
        });
        return NextResponse.json({
            savedVersion: 1,
            restoredVersion: restored.version,
            contents,
        })
    } finally {
        await secondSandbox.stop();
    }
}