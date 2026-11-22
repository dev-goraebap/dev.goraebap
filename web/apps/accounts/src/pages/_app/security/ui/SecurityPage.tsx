import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@goraebap/ui-react/components/button";
import { logoutAllSessions, logoutCurrentSession, type AuthMe } from "@/entities/session";
import { AgentTokenSection } from "@/features/agent-token";
import { PageHeader } from "@/shared/ui";

interface SecurityPageProps {
  user: AuthMe;
}

export function SecurityPage({ user }: SecurityPageProps) {
  const navigate = useNavigate();
  const [busyLogout, setBusyLogout] = useState<"one" | "all" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleLogout(all: boolean) {
    setError(null);
    setBusyLogout(all ? "all" : "one");
    try {
      if (all) {
        await logoutAllSessions();
      } else {
        await logoutCurrentSession();
      }
      await navigate({ to: "/login", search: { next: undefined } });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "로그아웃하지 못했습니다.");
    } finally {
      setBusyLogout(null);
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="보안 · 토큰"
        description="활성 세션과 에이전트(MCP) 접근 토큰을 관리합니다."
      />

      <section className="border-border bg-card space-y-4 rounded-xl border p-6">
        <div className="space-y-1">
          <h2 className="text-base font-semibold tracking-tight">세션 관리</h2>
          <p className="text-muted-foreground text-xs">
            현재 세션 만료: {new Date(user.expiresAt).toLocaleString("ko-KR")}
          </p>
        </div>

        {error ? (
          <p
            role="alert"
            className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-xs"
          >
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={busyLogout !== null}
            onClick={() => void handleLogout(false)}
          >
            {busyLogout === "one" ? "처리 중…" : "현재 기기 로그아웃"}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={busyLogout !== null}
            onClick={() => void handleLogout(true)}
          >
            {busyLogout === "all" ? "처리 중…" : "모든 기기에서 로그아웃"}
          </Button>
        </div>
      </section>

      <AgentTokenSection />
    </div>
  );
}
