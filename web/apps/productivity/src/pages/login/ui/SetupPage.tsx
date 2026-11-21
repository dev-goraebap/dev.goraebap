import { useMutation } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { sendCommand } from '@/shared/api';
import { BrandWordmark } from '@/shared/ui/brand';
import { Button } from '@/shared/ui/kit/button';
import { Card } from '@/shared/ui/kit/card';
import { Field, FieldDescription, FieldLabel } from '@/shared/ui/kit/field';
import { Input } from '@/shared/ui/kit/input';
import { Spinner } from '@/shared/ui/kit/spinner';
import { createFirstAdmin } from '../api/setup';
import { AuthBackground } from './AuthBackground';

/**
 * 첫 실행: 아직 아무도 없는 설치에서 첫 관리자를 만든다. 만든 사람은 인스턴스와 워크스페이스를 함께 맡고, 곧바로 그 이메일로
 * 인증 코드를 받아 로그인한다(onCreated). 누군가 먼저 만들었으면 서버가 거절하고 로그인으로 넘어간다.
 */
export function SetupPage({ onCreated }: { onCreated: (email: string) => void }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const create = useMutation({
    mutationFn: async () => {
      const admin = { name: name.trim(), email: email.trim() };
      await createFirstAdmin(admin);
      await sendCommand('/api/v1/auth/otp/request', 'POST', { email: admin.email });
      return admin.email;
    },
    onSuccess: onCreated,
  });
  const isReady = !!name.trim() && !!email.trim();
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (isReady && !create.isPending) create.mutate();
  };
  return (
    <main className="relative isolate flex min-h-dvh items-center justify-center overflow-hidden p-4">
      <AuthBackground />
      <Card className="w-95 max-w-full gap-5 rounded-(--radius-surface) px-6 shadow-xs">
        <div className="flex flex-col items-start gap-3">
          <BrandWordmark />
          <h1 className="text-2xl font-semibold text-balance">처음 오셨네요</h1>
          <p className="text-muted-foreground">이 cowork를 맡을 첫 관리자를 만듭니다. 만든 다음 그 이메일로 받은 인증 코드로 로그인합니다.</p>
        </div>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <Field>
            <FieldLabel htmlFor="setup-name">이름</FieldLabel>
            <Input id="setup-name" autoComplete="name" autoFocus placeholder="예: 김고래" maxLength={64}
              value={name} onChange={event => setName(event.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="setup-email">이메일</FieldLabel>
            <Input id="setup-email" type="email" autoComplete="email" placeholder="예: name@example.com"
              value={email} onChange={event => setEmail(event.target.value)} />
            <FieldDescription>로그인할 때마다 이 주소로 인증 코드를 보냅니다.</FieldDescription>
          </Field>
          <Button type="submit" className="w-full rounded-full max-md:h-11" disabled={!isReady || create.isPending} aria-busy={create.isPending || undefined}>
            {create.isPending ? <Spinner data-icon="inline-start" /> : null}
            첫 관리자 만들기
          </Button>
        </form>
        {create.error ? <p role="alert" className="text-muted-foreground">{create.error.message}</p> : null}
      </Card>
    </main>
  );
}
