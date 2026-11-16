import { useMutation } from '@tanstack/react-query';
import { useCallback, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { focusFirstInvalid } from '@/shared/lib/focus-invalid';
import { Alert, AlertTitle } from '@/shared/ui/alert';
import { TriangleAlertIcon } from '@/shared/ui/icon';
import { AuthButton, AuthCard, AuthField } from '../../../login/pages/auth-card/AuthCard';
import { GuardContext, SessionExpired, useSessionApi, WrongPassword, type Guard } from '../../entities/session';

/**
 * 만료되면 인증 화면만 보여 준다. 기존 화면은 지우지 않고 숨겨(hidden · inert) 쓰던 초안과 기다리는 요청이 남고,
 * 다시 로그인하면 기다리던 요청이 같은 순서로 이어진다.
 */
export function SessionGate({ children, initialExpired = false }: { children: ReactNode; initialExpired?: boolean }) {
  const [isExpired, setExpired] = useState(initialExpired);
  const waiting = useRef<(() => void)[]>([]);
  const guard = useCallback<Guard>(async run => {
    try { return await run(); } catch (error) {
      if (!(error instanceof SessionExpired)) throw error;
      setExpired(true);
      await new Promise<void>(resolve => { waiting.current.push(resolve); });
      return run();
    }
  }, []);
  const renew = () => { setExpired(false); waiting.current.splice(0).forEach(resume => resume()); };
  return <GuardContext value={guard}>
    <div hidden={isExpired} inert={isExpired} aria-hidden={isExpired || undefined} className="h-full">{children}</div>
    {isExpired ? <ReloginScreen onRenewed={renew} /> : null}
  </GuardContext>;
}

/** 같은 계정으로 다시 로그인. 이메일은 바꿀 수 없고 비밀번호만 받는다. 틀리면 양식 안의 알림으로 말한다. */
function ReloginScreen({ onRenewed }: { onRenewed: () => void }) {
  const api = useSessionApi();
  const [password, setPassword] = useState('');
  const [isTried, setTried] = useState(false);
  const signIn = useMutation({ mutationFn: () => api.signIn(password), onSuccess: onRenewed });
  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    if (signIn.isPending) return;
    if (!password) { setTried(true); focusFirstInvalid(); return; }
    signIn.mutate();
  };
  return <div className="h-full overflow-auto">
    <AuthCard title="다시 로그인해 주세요">
      <form className="flex flex-col gap-6" noValidate onSubmit={submit}>
        <div className="flex flex-col gap-4">
          <p className="text-muted-foreground">오래 쓰지 않아 로그인이 풀렸습니다. 다시 로그인하면 쓰던 내용이 그대로 남아 있습니다.</p>
          {signIn.isError ? <Alert variant="destructive">
            <TriangleAlertIcon />
            <AlertTitle>{signIn.error instanceof WrongPassword ? '비밀번호가 맞지 않습니다.' : '로그인하지 못했습니다. 잠시 후 다시 시도해 주세요.'}</AlertTitle>
          </Alert> : null}
          <AuthField label="이메일" type="email" value={api.account.email} readOnly />
          <AuthField label="비밀번호" type="password" autoComplete="current-password" autoFocus value={password} onChange={event => setPassword(event.target.value)}
            error={isTried && !password ? '비밀번호를 입력해 주세요.' : undefined} />
        </div>
        <AuthButton type="submit" isPending={signIn.isPending}>로그인</AuthButton>
      </form>
    </AuthCard>
  </div>;
}
