import { Text } from '@astryxdesign/core/Text';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@astryxdesign/core/Button';
import { CheckboxInput } from '@astryxdesign/core/CheckboxInput';
import { HStack } from '@astryxdesign/core/HStack';
import { Link } from '@astryxdesign/core/Link';
import { TextInput } from '@astryxdesign/core/TextInput';
import { VStack } from '@astryxdesign/core/VStack';
import { focusFirstInvalid } from '@kit/patterns/compose/validation';
import { useMutation } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { InvalidCredentials, useAuthApi } from '../../entities/auth';
import { AuthCard } from '../auth-card/AuthCard';
import styles from '../../app/login.module.css';

/**
 * 로그인. 칸이 비었으면 그 칸 곁에 알리고, 서버가 거절하면 양식 위 배너로 알린다. 배너는 어느 칸이 틀렸는지 말하지
 * 않고 입력은 그대로 둔다. 제출 버튼은 막지 않고 보내는 동안 진행 표시만 한다.
 */
export function LoginPage({ initialEmail = '', hasInitialFailure = false, onSignedIn }: {
  initialEmail?: string; hasInitialFailure?: boolean; onSignedIn: (name: string) => void;
}) {
  const api = useAuthApi();
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
    <form className={styles.form} noValidate onSubmit={submit}>
      <VStack gap={4}>
        <TextInput label="이메일" type="email" placeholder="name@example.com" value={email} onChange={setEmail} hasAutoFocus={!hasInitialFailure}
          statusVariant="detached" status={isTried && lacks.email ? { type: 'error', message: '이메일을 입력해 주세요.' } : undefined} />
        <VStack gap={2}>
          <TextInput label="비밀번호" type={isShown ? 'text' : 'password'} value={password} onChange={setPassword}
            statusVariant="detached" status={isTried && lacks.password ? { type: 'error', message: '비밀번호를 입력해 주세요.' } : undefined} />
          <HStack hAlign="between" vAlign="center" wrap="wrap" gap={2}>
            <CheckboxInput label="비밀번호 보기" value={isShown} onChange={setShown} />
            <Link href="/forgot">비밀번호 찾기</Link>
          </HStack>
        </VStack>
        {failure ? <Text className={styles.error} role="alert">{failure === 'credentials' ? '이메일 또는 비밀번호가 맞지 않습니다.' : '로그인하지 못했습니다. 잠시 후 다시 시도해 주세요.'}</Text> : null}
        <Button label="로그인" variant="primary" type="submit" isLoading={signIn.isPending} width="100%" />
        <div className={styles.links}><Link href="/signup">회원가입</Link><Link href="/otp">인증 코드로 로그인</Link></div>
      </VStack>
    </form>
  </AuthCard>;
}
