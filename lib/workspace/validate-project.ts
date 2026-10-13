
import "server-only";

import { createSandbox } from "@/lib/sandbox/create-sandbox";

const PROJECT_ROOT = "/vercel/sandbox/project";
const MAX_LOG_LENGTH = 8_000;

type SandboxInstance = Awaited<ReturnType<typeof createSandbox>>;

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
        const result = await sandbox.runCommand({
            cmd,
            args,
            cwd: PROJECT_ROOT,
        });

        const stdout = truncate(await result.stdout());
        const stderr = truncate(await result.stderr());

        return {
            name,
            status: result.exitCode === 0 ? "passed" : "failed",
            exitCode: result.exitCode,
            stdout,
            stderr,
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

    const entries = await sandbox.fs.readdir(PROJECT_ROOT, {
        withFileTypes: true,
    });

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

    const packageJsonText = await sandbox.fs.readFile(
        `${PROJECT_ROOT}/package.json`,
        "utf8",
    );

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
