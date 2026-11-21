import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { setupOptions } from '../api/setup';
import { LoginPage } from './LoginPage';
import { SetupPage } from './SetupPage';

/**
 * 로그인 주소의 화면: 아직 아무도 없는 설치면 첫 관리자 만들기, 아니면 로그인. 첫 관리자를 만들면 그 이메일로 코드를 이미 보낸
 * 로그인 화면으로 이어진다.
 */
export function LoginGate({ onSignedIn }: { onSignedIn: () => Promise<void> }) {
  const client = useQueryClient();
  const setup = useQuery(setupOptions());
  const [created, setCreated] = useState<string>();
  if (setup.isPending) return null;
  if (!created && setup.data?.needed) return <SetupPage onCreated={email => {
    setCreated(email);
    void client.invalidateQueries({ queryKey: setupOptions().queryKey });
  }} />;
  return <LoginPage onSignedIn={onSignedIn} codeSentTo={created} />;
}
