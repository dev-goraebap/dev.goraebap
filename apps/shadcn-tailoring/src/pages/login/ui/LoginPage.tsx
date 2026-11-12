import { useMutation } from "@tanstack/react-query"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { useState, type FormEvent, type ReactNode } from "react"
import { paths } from "@/shared/config"
import { safeRedirect, signIn } from "@/shared/lib/session"
import { BrandWordmark } from "@/shared/ui/brand"
import { Button } from "@/shared/ui/button"
import { Card } from "@/shared/ui/card"
import { Field, FieldLabel } from "@/shared/ui/field"
import { Input } from "@/shared/ui/input"
import { Spinner } from "@/shared/ui/spinner"
import { AuthBackground } from "./AuthBackground"
import { DevLogin } from "./DevLogin"

/** 서버 대신 잠깐 기다린다(호호코워크의 요청 중 표시를 같이 보이려고). */
const later = () => new Promise(resolve => setTimeout(resolve, 400))
/** 호호코워크 서버 AuthErrorCode.AUTH_CODE_INVALID의 문구. */
const CODE_INVALID = "코드가 올바르지 않거나 만료되었습니다. 다시 요청해 주세요"

/**
 * 로그인(호호코워크 LoginPage): 업무 이메일을 적으면 인증 코드를 보내고, 받은 코드로 들어간다. 앱 셸 밖의 화면이다.
 * 서버가 없으므로 어떤 이메일이든 코드를 "보내고", 숫자 여섯 자리면 어떤 코드든 들어간다. 그 밖의 코드는 서버와 같은 문구로 거절한다.
 * 들어가면 셸이 보낸 원래 주소(?redirect=)나 알림함으로 간다.
 */
export function LoginPage() {
  const navigate = useNavigate()
  const redirectTo = safeRedirect((useSearch({ strict: false }) as Record<string, unknown>).redirect)
  const [email, setEmail] = useState("")
  const [sentTo, setSentTo] = useState<string>()
  const [code, setCode] = useState("")
  const enter = (address: string) => {
    signIn(address)
    void navigate({ href: redirectTo ?? paths.notifications, replace: true })
  }
  const request = useMutation({ mutationFn: later, onSuccess: () => setSentTo(email.trim()) })
  const verify = useMutation({
    mutationFn: async () => {
      await later()
      if (!/^\d{6}$/.test(code.trim())) throw new Error(CODE_INVALID)
    },
    onSuccess: () => enter(sentTo!),
  })
  const error = (sentTo ? verify.error : request.error)?.message
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (sentTo) verify.mutate()
    else request.mutate()
  }
  return (
    <main className="relative isolate flex min-h-dvh items-center justify-center overflow-hidden p-4">
      <AuthBackground />
      <Card className="w-95 max-w-full gap-5 rounded-(--radius-surface) px-6 shadow-xs [--card-spacing:--spacing(6)]">
        <div className="flex flex-col items-start gap-3">
          <BrandWordmark />
          <h1 className="text-2xl font-semibold">로그인</h1>
          <p className="text-muted-foreground">{sentTo ? `${sentTo}로 보낸 인증 코드를 적어 주세요.` : "업무 이메일로 인증 코드를 보내 드립니다."}</p>
        </div>
        <form onSubmit={submit} className="flex flex-col gap-3">
          {sentTo ? (
            <>
              <Field>
                <FieldLabel htmlFor="login-code">인증 코드</FieldLabel>
                <Input id="login-code" inputMode="numeric" autoComplete="one-time-code" autoFocus placeholder="예: 123456"
                  value={code} onChange={event => setCode(event.target.value)} />
              </Field>
              <SubmitButton pending={verify.isPending} disabled={!code.trim()}>로그인</SubmitButton>
              <Button type="button" variant="secondary" className="w-full rounded-full"
                onClick={() => { setSentTo(undefined); setCode(""); verify.reset() }}>
                이메일 다시 적기
              </Button>
            </>
          ) : (
            <>
              <Field>
                <FieldLabel htmlFor="login-email">업무 이메일</FieldLabel>
                <Input id="login-email" type="email" autoComplete="email" placeholder="예: name@hohoco.store"
                  value={email} onChange={event => setEmail(event.target.value)} />
              </Field>
              <SubmitButton pending={request.isPending} disabled={!email.trim()}>인증 코드 받기</SubmitButton>
            </>
          )}
        </form>
        {error ? <p role="alert" className="text-muted-foreground">{error}</p> : null}
        <DevLogin onSignIn={enter} />
      </Card>
    </main>
  )
}

/** 보내는 동안은 글자 앞에 도는 표시를 두고 다시 누르지 못하게 한다(호호코워크 Button isLoading). */
function SubmitButton({ pending, disabled, children }: { pending: boolean; disabled: boolean; children: ReactNode }) {
  return (
    <Button type="submit" className="w-full rounded-full" disabled={disabled || pending} aria-busy={pending}>
      {pending ? <Spinner data-icon="inline-start" /> : null}
      {children}
    </Button>
  )
}
