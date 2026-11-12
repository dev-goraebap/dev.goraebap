import { AuthCard } from '../../../login/pages/auth-card/AuthCard';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { Text } from '@astryxdesign/core/Text';
import { TextInput } from '@astryxdesign/core/TextInput';
import { VStack } from '@astryxdesign/core/VStack';
import { AppDialog } from '@/shared/ui/composites/dialog/AppDialog';
import { useIsPhone } from '@/shared/ui/foundations/media';
import { focusFirstInvalid } from '@/shared/ui/patterns/compose/validation';
import { useMutation } from '@tanstack/react-query';
import { useCallback, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { GuardContext, SessionExpired, useSessionApi, WrongPassword, type Guard } from '../../entities/session';
import styles from '../../app/errors.module.css';

/** 만료되면 인증 화면만 보여 줍니다. 숨긴 페이지의 초안과 대기 요청은 로그인 뒤 이어집니다. */
export function SessionGate({ children, initialExpired=false }: { children: ReactNode;initialExpired?:boolean }) {
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
    <div hidden={isExpired} inert={isExpired} aria-hidden={isExpired || undefined} style={{height:'100%',display:isExpired?'none':'block'}}>{children}</div>
    {isExpired ? <ReloginDialog onRenewed={renew} /> : null}
  </GuardContext>;
}

function ReloginDialog({ onRenewed }: { onRenewed: () => void }) {
  const api = useSessionApi();
  const isPhone = useIsPhone();
  const [password, setPassword] = useState('');
  const [isTried, setTried] = useState(false);
  const signIn = useMutation({ mutationFn: () => api.signIn(password), onSuccess: onRenewed });
  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    if (signIn.isPending) return;
    if (!password) { setTried(true); focusFirstInvalid(); return; }
    signIn.mutate();
  };
  return <AuthCard title="다시 로그인해 주세요">
    <form className={styles.relogin} noValidate onSubmit={submit}>
      <VStack gap={4}>
        <Text color="secondary">오래 쓰지 않아 로그인이 풀렸습니다. 다시 로그인하면 쓰던 내용이 그대로 남아 있습니다.</Text>
        {signIn.isError ? <Banner status="error" container="section" collapsible={false}
          title={signIn.error instanceof WrongPassword ? '비밀번호가 맞지 않습니다.' : '로그인하지 못했습니다. 잠시 후 다시 시도해 주세요.'} /> : null}
        <TextInput label="이메일" type="email" value={api.account.email} isReadOnly />
        <TextInput label="비밀번호" type="password" value={password} onChange={setPassword} hasAutoFocus
          statusVariant="detached" status={isTried && !password ? { type: 'error', message: '비밀번호를 입력해 주세요.' } : undefined} />
      </VStack>
      <Button label="로그인" variant="primary" type="submit" isLoading={signIn.isPending} width="100%" />
    </form>
  </AuthCard>;
}
