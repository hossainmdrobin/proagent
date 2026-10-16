
import "server-only";

import type { Sandbox } from "@vercel/sandbox";

const ROOT = "/vercel/sandbox/project";

async function runNpm(
  sandbox: Sandbox,
  args: string[],
): Promise<void> {
  const result = await sandbox.runCommand({
    cmd: "npm",
    args,
    cwd: ROOT,
  });

  const stdout = await result.stdout();
  const stderr = await result.stderr();

  if (result.exitCode !== 0) {
    throw new Error(
      `Vite initialization failed: npm ${args.join(" ")}\n` +
        `Exit code: ${result.exitCode}\n` +
        `${stderr.slice(-4000)}\n${stdout.slice(-4000)}`,
    );
  }
}

export async function initializeViteProject(
  sandbox: Sandbox,
): Promise<void> {
  await sandbox.fs.mkdir(ROOT, { recursive: true });

  // Never initialize over existing files.
  const entries = await sandbox.fs.readdir(ROOT, {
    withFileTypes: true,
  });

  if (entries.length > 0) {
    throw new Error(
      "Cannot initialize Vite: the sandbox project directory is not empty.",
    );
  }

  // Generate a React + TypeScript + Vite application.
  await runNpm(sandbox, [
    "create",
    "vite@latest",
    ".",
    "--",
    "--template",
    "react-ts",
  ]);

  // Install dependencies and the standard frontend stack.
  await runNpm(sandbox, [
    "install",
    "--no-audit",
    "--no-fund",
  ]);

  await runNpm(sandbox, [
    "install",
    "tailwindcss",
    "@tailwindcss/vite",
    "react-router-dom",
    "@tanstack/react-query",
    "--no-audit",
    "--no-fund",
  ]);

  // Configure Tailwind CSS v4 in Vite.
  const configPath = `${ROOT}/vite.config.ts`;
  const config = (
    await sandbox.fs.readFile(configPath, "utf8")
  ).toString();

  if (
    !config.includes('from "@tailwindcss/vite"') &&
    !config.includes("from '@tailwindcss/vite'")
  ) {
    const updatedConfig = config.replace(
      /import\s+\{\s*defineConfig\s*\}\s+from\s+["']vite["'];?/,
      (match) =>
        `${match}\nimport tailwindcss from "@tailwindcss/vite";`,
    ).replace(
      /plugins:\s*\[([^\]]*)\]/,
      (match, plugins: string) =>
        `plugins: [${plugins.trim()}, tailwindcss()]`,
    );

    if (
      updatedConfig === config ||
      !updatedConfig.includes("tailwindcss()")
    ) {
      throw new Error(
        "Could not safely configure Tailwind in vite.config.ts",
      );
    }

    await sandbox.fs.writeFile(configPath, updatedConfig);
  }

  // Enable Tailwind CSS.
  await sandbox.fs.writeFile(
    `${ROOT}/src/index.css`,
    '@import "tailwindcss";\n',
  );

  // Verify that the starter builds before it is persisted.
  await runNpm(sandbox, ["run", "build"]);
}
