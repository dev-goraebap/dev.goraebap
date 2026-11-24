import { Injectable, inject } from "@angular/core";
import { Api } from "@/shared/api/http";
import { ServerState, queryOptions } from "@/shared/lib/server-state";

export type AgentTokenLifetime = "DAYS_30" | "DAYS_90" | "DAYS_365" | "NONE";

export interface AgentToken {
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

export const LIFETIME_OPTIONS: { value: AgentTokenLifetime; label: string }[] = [
  { value: "DAYS_30", label: "30일" },
  { value: "DAYS_90", label: "90일" },
  { value: "DAYS_365", label: "365일" },
  { value: "NONE", label: "만료 없음" },
];

const TOKENS_KEY = ["session", "agent-tokens"] as const;

// 에이전트(MCP) 접근 토큰. 목록은 캐시가 소유하고, 발급·폐기 뒤에는 목록 키를 무효화한다.
@Injectable({ providedIn: "root" })
export class AgentTokenApi {
  private readonly api = inject(Api);
  private readonly state = inject(ServerState);

  readonly list = queryOptions<AgentToken[]>({
    key: TOKENS_KEY,
    fetch: () =>
      this.api.get<AgentToken[]>("/api/v1/me/agent-tokens", "토큰 목록을 불러오지 못했습니다."),
  });

  // 비밀값은 발급할 때 한 번만 돌아온다.
  async create(input: { name: string; agentName: string; lifetime: AgentTokenLifetime }) {
    const created = await this.api.send<{ token: AgentToken; secret: string }>(
      "POST",
      "/api/v1/me/agent-tokens",
      { name: input.name, agentName: input.agentName || null, lifetime: input.lifetime },
      "토큰을 발급하지 못했습니다.",
    );
    await this.state.invalidate(TOKENS_KEY);
    return created;
  }

  async revoke(id: string) {
    await this.api.send(
      "DELETE",
      `/api/v1/me/agent-tokens/${id}`,
      undefined,
      "토큰을 폐기하지 못했습니다.",
    );
    await this.state.invalidate(TOKENS_KEY);
  }
}
