import { Button } from '@astryxdesign/core/Button';
import { Text } from '@astryxdesign/core/Text';
import { TextInput } from '@astryxdesign/core/TextInput';
import { VStack } from '@astryxdesign/core/VStack';
import { focusFirstInvalid } from '@kit/patterns/compose/validation';
import { useMutation } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { useAuthApi } from '../../entities/auth';
import { AuthCard } from '../auth-card/AuthCard';
import styles from '../../app/login.module.css';

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
    <VStack gap={6}>
      <VStack gap={1} role="status">
        <Text weight="semibold">{sentTo}</Text>
        <Text color="secondary">가입된 주소라면 비밀번호를 다시 정하는 안내가 도착합니다. 보이지 않으면 스팸함을 확인해 주세요.</Text>
      </VStack>
      <VStack gap={2}>
        <Button label="로그인으로 돌아가기" variant="primary" width="100%" onClick={onBack} />
        <Button label="다시 보내기" variant="ghost" width="100%" isLoading={send.isPending} onClick={() => send.mutate(sentTo)} />
      </VStack>
    </VStack>
  </AuthCard>;
  return <AuthCard title="비밀번호 찾기">
    <form className={styles.form} noValidate onSubmit={submit}>
      <VStack gap={4}>
        <Text color="secondary">가입한 이메일을 입력하면 비밀번호를 다시 정하는 안내를 보냅니다.</Text>
        <TextInput label="이메일" type="email" placeholder="name@example.com" value={email} onChange={setEmail} hasAutoFocus
          status={isTried && !email.trim() ? { type: 'error', message: '이메일을 입력해 주세요.' } : undefined} />
        <VStack gap={2}>
          <Button label="안내 메일 보내기" variant="primary" type="submit" isLoading={send.isPending} width="100%" />
          <Button label="로그인으로 돌아가기" variant="ghost" width="100%" onClick={onBack} />
        </VStack>
      </VStack>
    </form>
  </AuthCard>;
}
