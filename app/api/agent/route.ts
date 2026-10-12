import { NextResponse } from "next/server";
import type { Agent, CreateAgentRequest } from "@/store/features/agents-api";

const agents: Agent[] = [
  { id: "1", name: "Saad", role: "Researcher" },
  { id: "2", name: "Kilo", role: "Reviewer" },
];

export async function GET() {
  return NextResponse.json(agents);
}

export async function POST(request: Request) {
  const body = (await request.json()) as CreateAgentRequest;
  const agent: Agent = { id: crypto.randomUUID(), ...body };

  agents.push(agent);

  return NextResponse.json(agent, { status: 201 });
}
