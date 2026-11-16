import { useMutation } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useState, type FormEvent } from 'react';
import { focusFirstInvalid } from '@/shared/lib/focus-invalid';
import { useAuthApi } from '../../entities/auth';
import { AuthButton, AuthCard, AuthError, AuthField, textLink } from '../auth-card/AuthCard';

/** 회원가입: 이름 · 이메일 · 비밀번호. 처음 누른 뒤부터 칸 곁에 알리고, 만들면 그 이메일로 인증 코드를 받는 화면으로 간다. */
export function SignUpPage({ onCreated }: { onCreated: (email: string) => void }) {
  const api = useAuthApi();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isTried, setTried] = useState(false);
  const errors = {
    name: !name.trim() ? '이름을 입력해 주세요.' : undefined,
    email: !/^\S+@\S+\.\S+$/.test(email) ? '이메일 주소를 확인해 주세요.' : undefined,
    password: password.length < 8 ? '비밀번호는 8자 이상 입력해 주세요.' : undefined,
  };
  const save = useMutation({ mutationFn: () => api.signUp(name.trim(), email.trim(), password), onSuccess: () => onCreated(email) });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    setTried(true);
    if (Object.values(errors).some(Boolean)) { focusFirstInvalid(); return; }
    save.mutate();
  };
  return <AuthCard title="회원가입">
    <form noValidate onSubmit={submit} className="flex flex-col gap-4">
      <AuthField label="이름" autoComplete="name" value={name} onChange={event => setName(event.target.value)} error={isTried ? errors.name : undefined} />
      <AuthField label="이메일" type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} error={isTried ? errors.email : undefined} />
      <AuthField label="비밀번호" type="password" autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)}
        error={isTried ? errors.password : undefined} />
      {save.isError ? <AuthError>{save.error.message}</AuthError> : null}
      <AuthButton type="submit" isPending={save.isPending}>계정 만들기</AuthButton>
      <Link to={'/login' as string} className={textLink}>로그인으로</Link>
    </form>
  </AuthCard>;
}

/** 이메일로 로그인: 이메일을 받아 6자리 코드를 보내고, 같은 카드가 코드 입력으로 바뀐다. 코드가 틀리면 양식 안에서 알린다. */
export function OtpPage({ initialEmail = '', hasCode = false, onSignedIn }: { initialEmail?: string; hasCode?: boolean; onSignedIn: (name: string) => void }) {
  const api = useAuthApi();
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [isSent, setSent] = useState(hasCode);
  const [isTried, setTried] = useState(false);
  const request = useMutation({ mutationFn: () => api.requestCode(email), onSuccess: () => { setSent(true); setTried(false); } });
  const verify = useMutation({ mutationFn: () => api.verifyCode(email, code), onSuccess: account => onSignedIn(account.name) });
  const isInvalid = isSent ? !/^\d{6}$/.test(code) : !/^\S+@\S+\.\S+$/.test(email);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    setTried(true);
    if (isInvalid) { focusFirstInvalid(); return; }
    if (isSent) verify.mutate(); else request.mutate();
  };
  const failure = verify.error?.message ?? request.error?.message;
  return <AuthCard title={isSent ? '인증 코드 입력' : '이메일로 로그인'}>
    <form noValidate className="flex flex-col gap-4" onSubmit={submit}>
      {isSent ? <>
        <p className="text-muted-foreground">{email}로 보낸 6자리 코드를 입력해 주세요.</p>
        <AuthField label="인증 코드" inputMode="numeric" autoComplete="one-time-code" maxLength={6} autoFocus value={code} onChange={event => setCode(event.target.value)}
          error={isTried && isInvalid ? '6자리 코드를 입력해 주세요.' : undefined} />
      </> : <AuthField label="이메일" type="email" autoComplete="email" autoFocus value={email} onChange={event => setEmail(event.target.value)}
        error={isTried && isInvalid ? '이메일 주소를 확인해 주세요.' : undefined} />}
      {failure ? <AuthError>{failure}</AuthError> : null}
      <AuthButton type="submit" isPending={verify.isPending || request.isPending}>{isSent ? '인증하고 로그인' : '인증 코드 보내기'}</AuthButton>
      {isSent ? <AuthButton type="button" variant="ghost" isPending={request.isPending} onClick={() => request.mutate()}>코드 다시 보내기</AuthButton> : null}
      <Link to={'/login' as string} className={textLink}>로그인으로</Link>
    </form>
  </AuthCard>;
}
