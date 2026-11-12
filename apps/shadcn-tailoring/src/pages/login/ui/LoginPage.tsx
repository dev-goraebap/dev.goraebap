import { useNavigate, useSearch } from "@tanstack/react-router"
import { useState, type FormEvent } from "react"
import { paths } from "@/shared/config"
import { safeRedirect, signIn } from "@/shared/lib/session"
import { BrandWordmark } from "@/shared/ui/brand"
import { Button } from "@/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader } from "@/shared/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/shared/ui/field"
import { Input } from "@/shared/ui/input"
import { AuthBackground } from "./AuthBackground"

/**
 * 로그인(호호코워크 LoginPage): 업무 이메일을 적으면 인증 코드를 보내고, 받은 코드로 들어간다. 앱 셸 밖의 화면이다.
 * 서버가 없으므로 어떤 값이든 들어가고, 셸이 보낸 원래 주소(?redirect=)나 알림함으로 간다.
 */
export function LoginPage() {
  const navigate = useNavigate()
  const redirectTo = safeRedirect((useSearch({ strict: false }) as Record<string, unknown>).redirect)
  const [email, setEmail] = useState("")
  const [sentTo, setSentTo] = useState<string>()
  const [code, setCode] = useState("")
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (sentTo) {
      signIn(sentTo)
      void navigate({ href: redirectTo ?? paths.notifications, replace: true })
    }
    else setSentTo(email.trim())
  }
  return (
    <main className="relative isolate flex min-h-svh items-center justify-center overflow-hidden p-4">
      <AuthBackground />
      <Card className="w-95 max-w-full gap-5 [--card-spacing:--spacing(6)]">
        <CardHeader className="justify-items-start gap-3">
          <BrandWordmark />
          <h1 className="text-2xl font-semibold">로그인</h1>
          <CardDescription>{sentTo ? `${sentTo}로 보낸 인증 코드를 적어 주세요.` : "업무 이메일로 인증 코드를 보내 드립니다."}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit}>
            <FieldGroup className="gap-3">
              {sentTo ? (
                <>
                  <Field>
                    <FieldLabel htmlFor="login-code">인증 코드</FieldLabel>
                    <Input id="login-code" inputMode="numeric" autoComplete="one-time-code" autoFocus placeholder="예: 123456"
                      value={code} onChange={event => setCode(event.target.value)} />
                  </Field>
                  <Button type="submit" className="w-full rounded-full" disabled={!code.trim()}>로그인</Button>
                  <Button type="button" variant="secondary" className="w-full rounded-full" onClick={() => { setSentTo(undefined); setCode("") }}>
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
                  <Button type="submit" className="w-full rounded-full" disabled={!email.trim()}>인증 코드 받기</Button>
                </>
              )}
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
