import { readProblemMessage, sendAuthMutation } from "@/entities/session";

export type AgentTokenLifetime = "DAYS_30" | "DAYS_90" | "DAYS_365" | "NONE";

export interface AgentTokenView {
  id: string;
  name: string;
  agentName: string | null;
  prefix: string;
  createdAt: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
  lastUsedIp: string | null;
  expired: boolean;
}

export interface AgentTokenCreated {
  token: AgentTokenView;
  secret: string;
}

export async function listAgentTokens(): Promise<AgentTokenView[]> {
  const response = await fetch("/api/v1/me/agent-tokens", { credentials: "include" });
  if (!response.ok) {
    throw new Error(
      await readProblemMessage(response, "에이전트 토큰 목록을 불러오지 못했습니다."),
    );
  }
  return (await response.json()) as AgentTokenView[];
}

export async function createAgentToken(input: {
  name: string;
  agentName: string;
  lifetime: AgentTokenLifetime;
}): Promise<AgentTokenCreated> {
  const response = await sendAuthMutation("POST", "/api/v1/me/agent-tokens", {
    name: input.name,
    agentName: input.agentName || null,
    lifetime: input.lifetime,
  });
  return (await response.json()) as AgentTokenCreated;
}

export async function revokeAgentToken(tokenId: string): Promise<void> {
  await sendAuthMutation("DELETE", `/api/v1/me/agent-tokens/${tokenId}`);
}
