import "server-only";

import {
  BaseSandbox,
  type FileUploadResponse,
  type FileDownloadResponse,
} from "deepagents";
import type { Sandbox } from "@daytona/sdk";
import { ROOT } from "@/lib/sandbox/create-sandbox";

export class DaytonaBackend extends BaseSandbox {
  readonly id: string;

  constructor(
    private readonly sandbox: Sandbox,
    projectId: string,
  ) {
    super();
    this.id = `daytona-${projectId}`;
  }

  async execute(command: string) {
    const result = await this.sandbox.process.executeCommand(
      command,
      ROOT,
    );

    return {
      output: result.artifacts?.stdout ?? "",
      exitCode: result.exitCode ?? 0,
      truncated: false,
    };
  }

  async uploadFiles(
    files: Array<[string, Uint8Array]>,
  ): Promise<FileUploadResponse[]> {
    const responses: FileUploadResponse[] = [];

    for (const [filePath, content] of files) {
      try {
        const relative = filePath.replace(/^\/+/, "");
        const parts = relative.split("/");

        if (
          !relative ||
          parts.some((part) => !part || part === "." || part === "..")
        ) {
          throw new Error("Invalid file path");
        }

        let directory = ROOT;

        for (const part of parts.slice(0, -1)) {
          directory += `/${part}`;

          try {
            await this.sandbox.fs.createFolder(directory, "755");
          } catch {
            // The directory may already exist.
          }
        }

        await this.sandbox.fs.uploadFile(
          Buffer.from(content),
          `${ROOT}/${relative}`,
        );

        responses.push({ path: filePath, error: null });
      } catch {
        responses.push({ path: filePath, error: "upload_failed" as FileUploadResponse["error"] });
      }
    }

    return responses;
  }

  async downloadFiles(
    paths: string[],
  ): Promise<FileDownloadResponse[]> {
    const responses: FileDownloadResponse[] = [];

    for (const filePath of paths) {
      try {
        const relative = filePath.replace(/^\/+/, "");
        const parts = relative.split("/");

        if (
          !relative ||
          parts.some((part) => !part || part === "." || part === "..")
        ) {
          throw new Error("Invalid file path");
        }

        const content = await this.sandbox.fs.downloadFile(
          `${ROOT}/${relative}`,
        );

        responses.push({
          path: filePath,
          content: new Uint8Array(content),
          error: null,
        });
      } catch {
        responses.push({
          path: filePath,
          content: null,
          error: "not_found" as FileDownloadResponse["error"],
        });
      }
    }

    return responses;
  }
}
