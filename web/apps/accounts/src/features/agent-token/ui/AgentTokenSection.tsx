import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@goraebap/ui-react/components/button";
import {
  createAgentToken,
  listAgentTokens,
  revokeAgentToken,
  type AgentTokenLifetime,
  type AgentTokenView,
} from "../api/agent-token-api";

const LIFETIME_OPTIONS: Array<{ value: AgentTokenLifetime; label: string }> = [
  { value: "DAYS_30", label: "30일" },
  { value: "DAYS_90", label: "90일" },
  { value: "DAYS_365", label: "365일" },
  { value: "NONE", label: "만료 없음" },
];

export function AgentTokenSection() {
  const [tokens, setTokens] = useState<AgentTokenView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [tokenName, setTokenName] = useState("");
  const [agentName, setAgentName] = useState("");
  const [lifetime, setLifetime] = useState<AgentTokenLifetime>("DAYS_90");
  const [creating, setCreating] = useState(false);
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    listAgentTokens()
      .then((list) => {
        if (active) setTokens(list);
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : "토큰 목록을 불러오지 못했습니다.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setCreating(true);
    try {
      const created = await createAgentToken({
        name: tokenName.trim(),
        agentName: agentName.trim(),
        lifetime,
      });
      setTokens((prev) => [created.token, ...prev]);
      setNewSecret(created.secret);
      setCopiedSecret(false);
      setTokenName("");
      setAgentName("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "토큰을 발급하지 못했습니다.");
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(tokenId: string) {
    setError(null);
    setRevokingId(tokenId);
    try {
      await revokeAgentToken(tokenId);
      setTokens((prev) => prev.filter((item) => item.id !== tokenId));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "토큰을 폐기하지 못했습니다.");
    } finally {
      setRevokingId(null);
    }
  }

  async function handleCopy() {
    if (!newSecret) return;
    try {
      await navigator.clipboard.writeText(newSecret);
      setCopiedSecret(true);
    } catch {
      setCopiedSecret(false);
    }
  }

  return (
    <section className="border-border bg-card space-y-5 rounded-xl border p-6">
      <div className="space-y-1">
        <h2 className="text-base font-semibold tracking-tight">에이전트 토큰 (MCP)</h2>
        <p className="text-muted-foreground text-xs">
          Claude·Codex·Antigravity 등 에이전트가 내 권한으로 API/MCP에 접근할 때 쓰는 토큰입니다.
        </p>
      </div>

      {error ? (
        <p role="alert" className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-xs">
          {error}
        </p>
      ) : null}

      {newSecret ? (
        <div className="border-border bg-secondary/60 space-y-2 rounded-lg border p-4">
          <p className="text-xs font-medium">
            새 토큰이 발급되었습니다. 이 화면을 벗어나면 다시 볼 수 없습니다.
          </p>
          <div className="bg-background flex items-center justify-between gap-2 rounded px-3 py-2 font-mono text-xs">
            <code className="truncate">{newSecret}</code>
            <Button size="sm" variant="outline" onClick={() => void handleCopy()}>
              {copiedSecret ? "복사됨" : "복사"}
            </Button>
          </div>
        </div>
      ) : null}

      <form onSubmit={(e) => void handleCreate(e)} className="grid gap-3 sm:grid-cols-3">
        <input
          type="text"
          required
          value={tokenName}
          onChange={(e) => setTokenName(e.target.value)}
          placeholder="토큰 용도 (예: 로컬 CLI)"
          className="border-input bg-background focus-visible:ring-ring flex h-9 rounded-md border px-3 text-xs outline-none focus-visible:ring-2"
        />
        <input
          type="text"
          value={agentName}
          onChange={(e) => setAgentName(e.target.value)}
          placeholder="에이전트 이름 (선택)"
          className="border-input bg-background focus-visible:ring-ring flex h-9 rounded-md border px-3 text-xs outline-none focus-visible:ring-2"
        />
        <div className="flex gap-2">
          <select
            aria-label="토큰 만료 기간"
            value={lifetime}
            onChange={(e) => setLifetime(e.target.value as AgentTokenLifetime)}
            className="border-input bg-background focus-visible:ring-ring flex h-9 flex-1 rounded-md border px-2 text-xs outline-none focus-visible:ring-2"
          >
            {LIFETIME_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <Button type="submit" size="sm" disabled={creating} className="h-9 shrink-0">
            {creating ? "발급 중…" : "발급"}
          </Button>
        </div>
      </form>

      {loading ? (
        <p className="text-muted-foreground text-xs">토큰 목록을 불러오는 중입니다…</p>
      ) : tokens.length === 0 ? (
        <p className="text-muted-foreground text-xs">발급된 에이전트 토큰이 없습니다.</p>
      ) : (
        <ul className="divide-border divide-y">
          {tokens.map((token) => (
            <li key={token.id} className="flex items-center justify-between gap-4 py-3 text-xs">
              <div className="min-w-0 space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-foreground font-medium">{token.name}</span>
                  {token.agentName ? (
                    <span className="bg-secondary text-muted-foreground rounded px-1.5 py-0.5 font-mono text-[10px]">
                      {token.agentName}
                    </span>
                  ) : null}
                  {token.expired ? <span className="text-destructive">만료됨</span> : null}
                </div>
                <p className="text-muted-foreground font-mono text-[11px]">
                  {token.prefix}… · 생성 {new Date(token.createdAt).toLocaleDateString("ko-KR")}
                  {token.expiresAt
                    ? ` · 만료 ${new Date(token.expiresAt).toLocaleDateString("ko-KR")}`
                    : " · 만료 없음"}
                </p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                disabled={revokingId === token.id}
                onClick={() => void handleRevoke(token.id)}
              >
                {revokingId === token.id ? "폐기 중…" : "폐기"}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
