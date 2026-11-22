import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@goraebap/ui-react/components/button";
import { completeOnboarding, getCurrentUser, updateMyName } from "@/entities/session";
import { resolveSafeNextUrl } from "@/shared/lib";

interface OnboardingPageProps {
  next?: string;
}

export function OnboardingPage({ next }: OnboardingPageProps) {
  const navigate = useNavigate();
  const safeNext = resolveSafeNextUrl(next);

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getCurrentUser()
      .then((me) => {
        if (!active) return;
        if (!me) {
          void navigate({ to: "/login", search: { next } });
          return;
        }
        setName(me.name ?? "");
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : "계정 정보를 확인하지 못했습니다.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [navigate, next]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      const trimmed = name.trim();
      if (trimmed) {
        await updateMyName(trimmed);
      }
      await completeOnboarding();
      if (safeNext) {
        window.location.assign(safeNext);
      } else {
        await navigate({ to: "/" });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "초기 설정을 저장하지 못했습니다.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="bg-sidebar text-foreground flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <section className="border-border bg-card w-full max-w-sm space-y-6 rounded-2xl border p-7 shadow-xs">
        {loading ? (
          <p className="text-muted-foreground text-sm">계정 정보를 불러오는 중입니다…</p>
        ) : (
          <>
            <div className="space-y-1.5">
              <p className="text-muted-foreground font-mono text-[11px]">goraebap accounts</p>
              <h1 className="text-xl font-semibold tracking-tight">처음 오셨네요</h1>
              <p className="text-muted-foreground text-sm">
                모든 <code>*.goraebap.xyz</code> 서비스에서 표시할 이름을 입력해 주세요.
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

            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
              <label className="block space-y-1.5">
                <span className="text-xs font-medium">표시 이름</span>
                <input
                  type="text"
                  required
                  maxLength={64}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="이름"
                  className="border-input bg-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 text-sm outline-none focus-visible:ring-2"
                />
              </label>
              <Button type="submit" disabled={pending} className="w-full">
                {pending ? "저장 중…" : "시작하기"}
              </Button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
