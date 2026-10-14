import "server-only";
import { Sandbox } from "@vercel/sandbox";

export async function createSandbox(projectId:string) {
  if (!/^[a-f\d]{24}$/i.test(projectId)) {
    throw new Error("Invalid project ID for sandbox");
  }

  const name = `proagent-${projectId.toLowerCase()}`;

  return Sandbox.getOrCreate({
    name,
    timeout: 5 * 60 * 1000,
    runtime: "node24",
    persistent:true,
    tags:{
      app:"proagent",
      projectId: projectId
    }
  });
}