import "server-only";
import { Sandbox } from "@vercel/sandbox";

export async function createSandbox() {
  return Sandbox.create({
    timeout: 5 * 60 * 1000,
    runtime: "node24",
  });
}