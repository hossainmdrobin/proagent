import "server-only";
import { Daytona } from "@daytona/sdk";
export const ROOT = '/home/daytona/workspace'

export async function createSandbox(projectId: string) {
  if (!/^[a-f\d]{24}$/i.test(projectId)) {
    throw new Error("Invalid project ID for sandbox");
  }

  const name = `proagent-${projectId.toLowerCase()}`;

  const daytona = new Daytona({
    apiKey: process.env.DAYTONA_API_KEY
  })

  // LOOKING FOR 
  const sandbox = await daytona.get(name);
  if (sandbox) return sandbox;

  const newSandbox = daytona.create({
    language: "typescript",
    name
  })

  return newSandbox;
}