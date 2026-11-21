import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@goraebap/ui/components/button";
import {
  createFirstAdmin,
  getCurrentUser,
  getSetupState,
  requestOtpCode,
  verifyOtpCode,
} from "@/entities/session";
import { resolveSafeNextUrl } from "@/shared/lib";

interface LoginPageProps {
  next?: string;
}

export function LoginPage({ next }: LoginPageProps) {
  const navigate = useNavigate();
  const safeNext = resolveSafeNextUrl(next);

  const [step, setStep] = useState<"setup" | "email" | "code">("email");
  const [adminName, setAdminName] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getSetupState()
      .then((state) => {
        if (active && state.needed) {
          setStep("setup");
        }
      })
      .catch(() => {
        // Server may still be starting; keep default email step.
      });
    return () => {
      active = false;
    };
  }, []);

  async function handleCreateAdmin(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setPending(true);
    try {
      const trimmedEmail = email.trim();
      await createFirstAdmin(adminName.trim(), trimmedEmail);
      await requestOtpCode(trimmedEmail);
      setStep("code");
      setNotice("최초 관리자 계정을 만들고 인증 코드를 보냈습니다. 서버 로그를 확인해 주세요.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "초기 계정을 만들지 못했습니다.");
    } finally {
      setPending(false);
    }
  }

  async function handleRequestCode(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setPending(true);
    try {
      await requestOtpCode(email.trim());
      setStep("code");
      setNotice("인증 코드를 보냈습니다. 메일함(또는 로컬 서버 로그)을 확인해 주세요.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "인증 코드를 보내지 못했습니다.");
    } finally {
      setPending(false);
    }
  }

  async function handleVerifyCode(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      await verifyOtpCode(email.trim(), code.trim());
      const me = await getCurrentUser();
      if (me && !me.onboarded) {
        await navigate({ to: "/onboarding", search: { next: safeNext ?? undefined } });
        return;
      }
      if (safeNext) {
        window.location.assign(safeNext);
      } else {
        await navigate({ to: "/" });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "인증 코드를 확인하지 못했습니다.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="bg-sidebar text-foreground flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <section className="border-border bg-card w-full max-w-sm space-y-6 rounded-2xl border p-7 shadow-xs">
        <div className="space-y-1.5">
          <p className="text-muted-foreground font-mono text-[11px]">goraebap accounts</p>
          <h1 className="text-xl font-semibold tracking-tight">
            {step === "setup" ? "최초 관리자 설정" : "로그인"}
          </h1>
          <p className="text-muted-foreground text-sm">
            {step === "setup"
              ? "아직 등록된 계정이 없습니다. 첫 관리자 계정을 만들어 주세요."
              : safeNext
                ? "로그인 후 요청한 서비스로 바로 돌아갑니다."
                : "이메일 인증 코드로 Goraebap 계정에 로그인합니다."}
          </p>
        </div>

        {safeNext ? (
          <div className="bg-secondary/70 text-muted-foreground rounded-md px-3 py-2 font-mono text-[11px]">
            이동 예정: {safeNext}
          </div>
        ) : null}

        {notice ? (
          <p className="bg-secondary text-secondary-foreground rounded-md px-3 py-2 text-xs">
            {notice}
          </p>
        ) : null}

        {error ? (
          <p
            role="alert"
            className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-xs"
          >
            {error}
          </p>
        ) : null}

        {step === "setup" ? (
          <form onSubmit={(e) => void handleCreateAdmin(e)} className="space-y-4">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium">이름</span>
              <input
                type="text"
                required
                maxLength={64}
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                placeholder="관리자 이름"
                className="border-input bg-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 text-sm outline-none focus-visible:ring-2"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium">이메일</span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@goraebap.xyz"
                className="border-input bg-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 text-sm outline-none focus-visible:ring-2"
              />
            </label>
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "생성 중…" : "관리자 계정 만들고 코드 받기"}
            </Button>
          </form>
        ) : step === "email" ? (
          <form onSubmit={(e) => void handleRequestCode(e)} className="space-y-4">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium">이메일</span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="border-input bg-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 text-sm outline-none focus-visible:ring-2"
              />
            </label>
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "보내는 중…" : "인증 코드 받기"}
            </Button>
          </form>
        ) : (
          <form onSubmit={(e) => void handleVerifyCode(e)} className="space-y-4">
            <div className="text-muted-foreground flex items-center justify-between text-xs">
              <span>{email}</span>
              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setCode("");
                  setError(null);
                  setNotice(null);
                }}
                className="hover:text-foreground cursor-pointer underline"
              >
                변경
              </button>
            </div>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium">인증 코드</span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="6자리 코드"
                className="border-input bg-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 font-mono text-sm tracking-widest outline-none focus-visible:ring-2"
              />
            </label>
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "확인 중…" : "로그인"}
            </Button>
          </form>
        )}
      </section>
    </div>
  );
}
