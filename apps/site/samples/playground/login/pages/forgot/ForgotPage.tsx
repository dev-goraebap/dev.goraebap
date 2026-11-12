import { useMutation } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { focusFirstInvalid } from '@/shared/lib/focus-invalid';
import { useAuthApi } from '../../entities/auth';
import { AuthButton, AuthCard, AuthField } from '../auth-card/AuthCard';

/**
 * 비밀번호 찾기. 이메일을 받아 재설정 안내를 보내고 같은 카드가 "보냄" 확인으로 바뀐다. 가입 여부는 알리지 않으므로
 * 확인 문구도 "가입된 주소라면"으로 쓴다.
 */
export function ForgotPage({ onBack }: { onBack: () => void }) {
  const api = useAuthApi();
  const [email, setEmail] = useState('');
  const [isTried, setTried] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const send = useMutation({
    mutationFn: (to: string) => api.requestReset(to),
    onSuccess: (_, to) => setSentTo(to),
  });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (send.isPending) return;
    if (!email.trim()) { setTried(true); focusFirstInvalid(); return; }
    send.mutate(email.trim());
  };
  if (sentTo) return <AuthCard title="메일을 보냈습니다">
    <div className="flex flex-col gap-6">
      <div role="status" className="flex flex-col gap-1">
        <p className="font-semibold">{sentTo}</p>
        <p className="text-muted-foreground">가입된 주소라면 비밀번호를 다시 정하는 안내가 도착합니다. 보이지 않으면 스팸함을 확인해 주세요.</p>
      </div>
      <div className="flex flex-col gap-2">
        <AuthButton onClick={onBack}>로그인으로 돌아가기</AuthButton>
        <AuthButton variant="ghost" isPending={send.isPending} onClick={() => send.mutate(sentTo)}>다시 보내기</AuthButton>
      </div>
    </div>
  </AuthCard>;
  return <AuthCard title="비밀번호 찾기">
    <form className="flex flex-col gap-4" noValidate onSubmit={submit}>
      <p className="text-muted-foreground">가입한 이메일을 입력하면 비밀번호를 다시 정하는 안내를 보냅니다.</p>
      <AuthField label="이메일" type="email" autoComplete="email" placeholder="name@example.com" value={email} onChange={event => setEmail(event.target.value)} autoFocus
        error={isTried && !email.trim() ? '이메일을 입력해 주세요.' : undefined} />
      <div className="flex flex-col gap-2">
        <AuthButton type="submit" isPending={send.isPending}>안내 메일 보내기</AuthButton>
        <AuthButton type="button" variant="ghost" onClick={onBack}>로그인으로 돌아가기</AuthButton>
      </div>
    </form>
  </AuthCard>;
}
