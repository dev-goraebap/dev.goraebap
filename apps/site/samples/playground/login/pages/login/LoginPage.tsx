import { useMutation } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useId, useState, type FormEvent } from 'react';
import { focusFirstInvalid } from '@/shared/lib/focus-invalid';
import { Checkbox } from '@/shared/ui/checkbox';
import { InvalidCredentials, useAuthApi } from '../../entities/auth';
import { AuthButton, AuthCard, AuthError, AuthField, textLink } from '../auth-card/AuthCard';

/**
 * 로그인. 칸이 비었으면 그 칸 곁에 알리고, 서버가 거절하면 양식 안 한 줄로 알린다. 그 줄은 어느 칸이 틀렸는지 말하지
 * 않고 입력은 그대로 둔다. 제출 버튼은 막지 않고 보내는 동안 진행 표시만 한다.
 */
export function LoginPage({ initialEmail = '', hasInitialFailure = false, onSignedIn }: {
  initialEmail?: string; hasInitialFailure?: boolean; onSignedIn: (name: string) => void;
}) {
  const api = useAuthApi();
  const showId = useId();
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [isShown, setShown] = useState(false);
  const [isTried, setTried] = useState(false);
  const [failure, setFailure] = useState<'credentials' | 'unknown' | null>(hasInitialFailure ? 'credentials' : null);
  const signIn = useMutation({
    mutationFn: () => api.signIn(email, password),
    onSuccess: account => onSignedIn(account.name),
    onError: error => setFailure(error instanceof InvalidCredentials ? 'credentials' : 'unknown'),
  });
  const lacks = { email: !email.trim(), password: !password };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (signIn.isPending) return;
    if (lacks.email || lacks.password) { setTried(true); focusFirstInvalid(); return; }
    setFailure(null);
    signIn.mutate();
  };
  return <AuthCard title="로그인">
    <form className="flex flex-col gap-4" noValidate onSubmit={submit}>
      <AuthField label="이메일" type="email" autoComplete="email" placeholder="name@example.com" value={email} onChange={event => setEmail(event.target.value)}
        autoFocus={!hasInitialFailure} error={isTried && lacks.email ? '이메일을 입력해 주세요.' : undefined} />
      <div className="flex flex-col gap-2">
        <AuthField label="비밀번호" type={isShown ? 'text' : 'password'} autoComplete="current-password" value={password}
          onChange={event => setPassword(event.target.value)} error={isTried && lacks.password ? '비밀번호를 입력해 주세요.' : undefined} />
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="flex min-h-11 items-center gap-2 text-sm md:min-h-0">
            <Checkbox id={showId} checked={isShown} onCheckedChange={setShown} aria-label="비밀번호 보기" />
            비밀번호 보기
          </label>
          <Link to={'/forgot' as string} className={textLink}>비밀번호 찾기</Link>
        </div>
      </div>
      {failure ? <AuthError>{failure === 'credentials' ? '이메일 또는 비밀번호가 맞지 않습니다.' : '로그인하지 못했습니다. 잠시 후 다시 시도해 주세요.'}</AuthError> : null}
      <AuthButton type="submit" isPending={signIn.isPending}>로그인</AuthButton>
      <div className="flex justify-center gap-4">
        <Link to={'/signup' as string} className={textLink}>회원가입</Link>
        <Link to={'/otp' as string} className={textLink}>인증 코드로 로그인</Link>
      </div>
    </form>
  </AuthCard>;
}
