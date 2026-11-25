import { useMutation } from '@tanstack/react-query';
import { useState, type SubmitEvent, type ReactNode } from 'react';
import { sendCommand } from '@/shared/api';
import { useIsMobile } from '@/shared/lib/use-mobile';
import { BrandMark } from '@/shared/ui/brand';
import { Button } from '@goraebap/ui-react/compact/button';
import { Card } from '@goraebap/ui-react/compact/card';
import { Field, FieldLabel } from '@goraebap/ui-react/components/field';
import { Input } from '@goraebap/ui-react/compact/input';
import { Spinner } from '@goraebap/ui-react/components/spinner';
import { AuthBackground } from './AuthBackground';
import { DevLogin } from './DevLogin';

/**
 * Signing in, as client/'s: the work email, then the code mailed to it. onSignedIn takes the member into the app. Where
 * the server offers it (local, dev), signing in as any member too. Each step is a form, so Enter sends it.
 */
export function LoginPage({ onSignedIn, codeSentTo }: {
  onSignedIn: () => Promise<void>;
  /** 코드를 이미 보낸 이메일(첫 관리자를 막 만들었을 때): 코드 적기부터 시작한다. */
  codeSentTo?: string;
}) {
  const isMobile = useIsMobile();
  const [email, setEmail] = useState(codeSentTo ?? '');
  const [sentTo, setSentTo] = useState<string | undefined>(codeSentTo);
  const [code, setCode] = useState('');
  const request = useMutation({ mutationFn: () => sendCommand('/api/v1/auth/otp/request', 'POST', { email: email.trim() }), onSuccess: () => setSentTo(email.trim()) });
  const verify = useMutation({ mutationFn: () => sendCommand('/api/v1/auth/otp/verify', 'POST', { email: sentTo, code: code.trim() }), onSuccess: onSignedIn });
  const error = (sentTo ? verify.error : request.error)?.message;
  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sentTo) { if (code.trim() && !verify.isPending) verify.mutate(); }
    else if (email.trim() && !request.isPending) request.mutate();
  };
  return (
    <main className="relative isolate flex min-h-dvh items-center justify-center overflow-hidden p-4 max-md:items-stretch max-md:bg-background max-md:p-0">
      {!isMobile ? <AuthBackground /> : null}
      <Card className="w-95 max-w-full gap-5 rounded-(--radius-surface) px-6 shadow-xs max-md:w-full max-md:flex-1 max-md:justify-center max-md:rounded-none max-md:bg-background max-md:px-6 max-md:py-8 max-md:shadow-none max-md:ring-0">
        <div className="flex flex-col items-start gap-3">
          <BrandMark size="2.5rem" />
          <h1 className="text-2xl font-semibold">로그인</h1>
          <p className="text-muted-foreground">{sentTo ? `${sentTo}로 보낸 인증 코드를 적어 주세요.` : '이메일로 인증 코드를 보내 드립니다.'}</p>
        </div>
        <form onSubmit={submit} className="flex flex-col gap-3">
          {sentTo ? (
            <>
              <Field>
                <FieldLabel htmlFor="login-code">인증 코드</FieldLabel>
                <Input id="login-code" inputMode="numeric" autoComplete="one-time-code" autoFocus placeholder="예: 123456"
                  value={code} onChange={event => setCode(event.target.value)} />
              </Field>
              <SubmitButton isPending={verify.isPending} isDisabled={!code.trim()}>로그인</SubmitButton>
              <Button type="button" variant="secondary" className="w-full rounded-full max-md:h-11"
                onClick={() => { setSentTo(undefined); setCode(''); verify.reset(); }}>
                이메일 다시 적기
              </Button>
            </>
          ) : (
            <>
              <Field>
                <FieldLabel htmlFor="login-email">이메일</FieldLabel>
                <Input id="login-email" type="email" autoComplete="email" placeholder="예: name@example.com"
                  value={email} onChange={event => setEmail(event.target.value)} />
              </Field>
              <SubmitButton isPending={request.isPending} isDisabled={!email.trim()}>인증 코드 받기</SubmitButton>
            </>
          )}
        </form>
        {error ? <p role="alert" className="text-muted-foreground">{error}</p> : null}
        <DevLogin onSignedIn={onSignedIn} />
      </Card>
    </main>
  );
}

/** While sending, a spinner before the words and no second press (the old Button isLoading). */
function SubmitButton({ isPending, isDisabled, children }: { isPending: boolean; isDisabled: boolean; children: ReactNode }) {
  return (
    <Button type="submit" className="w-full rounded-full max-md:h-11" disabled={isDisabled || isPending} aria-busy={isPending || undefined}>
      {isPending ? <Spinner data-icon="inline-start" /> : null}
      {children}
    </Button>
  );
}
