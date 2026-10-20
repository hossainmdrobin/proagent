import { Sandbox } from "@daytona/sdk";
import { ROOT } from "./create-sandbox";

function shellQuote(value: string): string {
    return "'" + value.replace(/'/g, "'\\''") + "'";
}

export async function readSandboxFile(
    sandbox: Sandbox,
    absolutePath: string,
): Promise<Buffer> {
    const command = `base64 < ${shellQuote(absolutePath)} | tr -d '\\n'`;

    const result = await sandbox.process.executeCommand(command, ROOT);

    if (result.exitCode !== 0) {
        throw new Error(
            `Failed to read ${absolutePath}: ${result.result || "Unknown error"}`,
        );
    }

    return Buffer.from(result.result.trim(), "base64");
}