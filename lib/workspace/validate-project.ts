import "server-only";

// [DAYTONA CHANGE]: Import the official Sandbox type from the Daytona SDK instead of the Vercel helper
import { Sandbox } from "@daytona/sdk";
import { ROOT } from "../sandbox/create-sandbox";

// [DAYTONA CHANGE]: Updated project root path from Vercel's path to Daytona's writable workspace path
const MAX_LOG_LENGTH = 8_000;

// [DAYTONA CHANGE]: Type alias updated to use Daytona's Sandbox class
type SandboxInstance = Sandbox;

export interface ProjectCheck {
    name: string;
    status: "passed" | "failed" | "skipped";
    exitCode?: number | null;
    stdout?: string;
    stderr?: string;
}

export interface ProjectValidationResult {
    passed: boolean;
    checks: ProjectCheck[];
}

type PackageManager = "npm" | "pnpm" | "yarn" | "bun";

function truncate(value: string): string {
    return value.slice(-MAX_LOG_LENGTH);
}

async function runCheck(
    sandbox: SandboxInstance,
    name: string,
    cmd: string,
    args: string[],
): Promise<ProjectCheck> {
    try {
        // [DAYTONA CHANGE]: Combine command and args into a single string 
        // and use Daytona's `sandbox.process.executeCommand(fullCommand, cwd)`
        const fullCommand = [cmd, ...args].join(" ");
        const result = await sandbox.process.executeCommand(fullCommand, ROOT);

        // [DAYTONA CHANGE]: Daytona returns combined output in `result.result` 
        // instead of separate async `.stdout()` and `.stderr()` stream methods.
        const output = truncate(result.result || "");

        return {
            name,
            status: result.exitCode === 0 ? "passed" : "failed",
            exitCode: result.exitCode,
            stdout: output, // Daytona combines stdout/stderr in result.result
        };
    } catch (error) {
        return {
            name,
            status: "failed",
            stderr:
                error instanceof Error
                    ? error.message
                    : "Command execution failed",
        };
    }
}

export async function validateProject(
    sandbox: SandboxInstance,
): Promise<ProjectValidationResult> {
    const checks: ProjectCheck[] = [];

    // [DAYTONA CHANGE]: Replaced Vercel's `sandbox.fs.readdir` with Daytona's `sandbox.fs.listFiles`
    const entries = await sandbox.fs.listFiles(ROOT);

    // Daytona's listFiles returns objects with `.name` and `.isDir` properties
    const rootFiles = new Set(entries.map((entry) => entry.name));

    if (!rootFiles.has("package.json")) {
        return {
            passed: false,
            checks: [
                {
                    name: "package.json",
                    status: "failed",
                    stderr: "No package.json found in the project root.",
                },
            ],
        };
    }

    // [DAYTONA CHANGE]: Replaced Vercel's `sandbox.fs.readFile` with a robust `cat` execution via Daytona process 
    // to reliably fetch text file content across all SDK versions.
    const packageJsonResult = await sandbox.process.executeCommand(
        `cat "${ROOT}/package.json"`,
        ROOT
    );

    if (packageJsonResult.exitCode !== 0) {
        return {
            passed: false,
            checks: [
                {
                    name: "package.json",
                    status: "failed",
                    stderr: "Failed to read package.json content.",
                },
            ],
        };
    }

    const packageJsonText = packageJsonResult.result;

    const packageJson: {
        scripts?: Record<string, string>;
        packageManager?: string;
    } = JSON.parse(packageJsonText);

    const scripts = packageJson.scripts ?? {};

    let manager: PackageManager;

    if (
        rootFiles.has("pnpm-lock.yaml") ||
        packageJson.packageManager?.startsWith("pnpm@")
    ) {
        manager = "pnpm";
    } else if (
        rootFiles.has("yarn.lock") ||
        packageJson.packageManager?.startsWith("yarn@")
    ) {
        manager = "yarn";
    } else if (
        rootFiles.has("bun.lock") ||
        rootFiles.has("bun.lockb") ||
        packageJson.packageManager?.startsWith("bun@")
    ) {
        manager = "bun";
    } else {
        manager = "npm";
    }

    const installArgs: Record<PackageManager, string[]> = {
        npm: [
            rootFiles.has("package-lock.json") ||
                rootFiles.has("npm-shrinkwrap.json")
                ? "ci"
                : "install",
            "--no-audit",
            "--no-fund",
        ],
        pnpm: ["install", "--frozen-lockfile"],
        yarn: ["install", "--immutable"],
        bun: ["install", "--frozen-lockfile"],
    };

    const runScriptArgs: Record<
        PackageManager,
        (script: string) => string[]
    > = {
        npm: (script) => ["run", script],
        pnpm: (script) => ["run", script],
        yarn: (script) => [script],
        bun: (script) => ["run", script],
    };

    const install = await runCheck(
        sandbox,
        "install",
        manager,
        installArgs[manager],
    );

    checks.push(install);

    if (install.status !== "passed") {
        return { passed: false, checks };
    }

    // Run optional checks only when the project defines them.
    const optionalScripts = [
        ["typecheck", "typecheck"],
        ["type-check", "type-check"],
        ["lint", "lint"],
        ["test", "test"],
    ] as const;

    const executed = new Set<string>();

    for (const [name, script] of optionalScripts) {
        if (executed.has(script) || typeof scripts[script] !== "string") {
            continue;
        }

        // Ignore npm's default placeholder test script.
        if (
            script === "test" &&
            /no test specified/i.test(scripts[script])
        ) {
            checks.push({
                name,
                status: "skipped",
                stderr: "No test suite is configured.",
            });
            executed.add(script);
            continue;
        }

        executed.add(script);

        const check = await runCheck(
            sandbox,
            name,
            manager,
            runScriptArgs[manager](script),
        );

        checks.push(check);

        if (check.status !== "passed") {
            return { passed: false, checks };
        }
    }

    // A production build is required for this milestone.
    if (typeof scripts.build !== "string") {
        checks.push({
            name: "build",
            status: "failed",
            stderr: "The project does not define a build script.",
        });

        return { passed: false, checks };
    }

    const build = await runCheck(
        sandbox,
        "build",
        manager,
        runScriptArgs[manager]("build"),
    );

    checks.push(build);

    return {
        passed: build.status === "passed",
        checks,
    };
}