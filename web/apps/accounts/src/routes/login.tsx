import { useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@goraebap/ui/components/button";
import { requestOtpCode, verifyOtpCode } from "@/lib/auth-api";
import { resolveSafeNextUrl } from "@/lib/safe-redirect";

interface LoginSearch {
  next?: string;
}

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): LoginSearch => ({
    next: typeof search.next === "string" ? search.next : undefined,
  }),
  component: LoginPage,
});

function LoginPage() {
  const { next } = Route.useSearch();
  const navigate = useNavigate();
  const safeNext = resolveSafeNextUrl(next);

  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

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
    <section className="border-border bg-card mx-auto w-full max-w-sm space-y-6 rounded-xl border p-6">
      <div className="space-y-1.5">
        <h1 className="text-xl font-semibold tracking-tight">로그인</h1>
        <p className="text-muted-foreground text-sm">
          {safeNext
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
        <p role="alert" className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-xs">
          {error}
        </p>
      ) : null}

      {step === "email" ? (
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
  );
}
