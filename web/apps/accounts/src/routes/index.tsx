import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@goraebap/ui/components/button";
import {
  getCurrentUser,
  logoutAllSessions,
  logoutCurrentSession,
  type AuthMe,
} from "@/lib/auth-api";

export const Route = createFileRoute("/")({
  component: AccountHubPage,
});

const services = [
  {
    name: "Productivity",
    description: "프로젝트 · 이슈 · 문서 협업 공간",
    href: "https://productivity.goraebap.xyz",
    devHint: "localhost:4420",
  },
  {
    name: "Blog & UI",
    description: "개발 기록 · @goraebap/ui 레지스트리",
    href: "https://blog.goraebap.xyz",
    devHint: "localhost:5173",
  },
];

function AccountHubPage() {
  const [user, setUser] = useState<AuthMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<"logout" | "logout-all" | null>(null);

  useEffect(() => {
    let active = true;
    getCurrentUser()
      .then((me) => {
        if (active) setUser(me);
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : "계정 정보를 불러오지 못했습니다.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleLogout(all: boolean) {
    setError(null);
    setBusyAction(all ? "logout-all" : "logout");
    try {
      if (all) {
        await logoutAllSessions();
      } else {
        await logoutCurrentSession();
      }
      setUser(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "로그아웃에 실패했습니다.");
    } finally {
      setBusyAction(null);
    }
  }

  if (loading) {
    return <p className="text-muted-foreground text-sm">계정 상태를 확인하는 중입니다…</p>;
  }

  if (!user) {
    return (
      <section className="border-border bg-card mx-auto w-full max-w-sm space-y-6 rounded-xl border p-6">
        <div className="space-y-1.5">
          <h1 className="text-xl font-semibold tracking-tight">Goraebap 통합 계정</h1>
          <p className="text-muted-foreground text-sm">
            한 번 로그인하면 연결된 모든 <code>*.goraebap.xyz</code> 서비스를 이용할 수 있습니다.
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
        <Button render={<Link to="/login" />} nativeButton={false} className="w-full">
          이메일로 로그인
        </Button>
      </section>
    );
  }

  return (
    <div className="space-y-8">
      <section className="border-border bg-card space-y-4 rounded-xl border p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-muted-foreground text-xs font-medium">로그인된 계정</p>
            <h1 className="text-xl font-semibold tracking-tight">{user.name || user.email}</h1>
            <p className="text-muted-foreground text-sm">{user.email}</p>
          </div>
          {user.roles.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {user.roles.map((role) => (
                <span
                  key={role}
                  className="bg-secondary text-secondary-foreground rounded-md px-2 py-0.5 font-mono text-[11px]"
                >
                  {role}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        <div className="border-border text-muted-foreground border-t pt-4 text-xs">
          세션 만료: {new Date(user.expiresAt).toLocaleString("ko-KR")}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">연결된 서비스</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {services.map((service) => (
            <a
              key={service.name}
              href={service.href}
              className="border-border bg-card hover:bg-accent/50 flex flex-col justify-between gap-3 rounded-lg border p-4 transition-colors"
            >
              <div className="space-y-1">
                <div className="text-sm font-medium">{service.name}</div>
                <p className="text-muted-foreground text-xs">{service.description}</p>
              </div>
              <span className="text-muted-foreground font-mono text-[11px]">{service.devHint}</span>
            </a>
          ))}
        </div>
      </section>

      <section className="border-border bg-card space-y-3 rounded-xl border p-6">
        <h2 className="text-sm font-semibold">세션 관리</h2>
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
            disabled={busyAction !== null}
            onClick={() => void handleLogout(false)}
          >
            {busyAction === "logout" ? "로그아웃 중…" : "현재 기기 로그아웃"}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={busyAction !== null}
            onClick={() => void handleLogout(true)}
          >
            {busyAction === "logout-all" ? "처리 중…" : "모든 기기에서 로그아웃"}
          </Button>
        </div>
      </section>
    </div>
  );
}
