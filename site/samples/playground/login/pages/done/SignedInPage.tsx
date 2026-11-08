import { Button } from '@astryxdesign/core/Button';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { AuthCard } from '../auth-card/AuthCard';

/** 로그인 뒤 도착지를 대신하는 화면. 실제 앱은 이 자리에서 업무 화면으로 이동한다. */
export function SignedInPage({ name, onSignOut }: { name: string; onSignOut: () => void }) {
  return <AuthCard title={`${name}님, 안녕하세요`}>
    <VStack gap={6}>
      <Text color="secondary" role="status">로그인했습니다.</Text>
      <Button label="로그아웃" variant="secondary" width="100%" onClick={onSignOut} />
    </VStack>
  </AuthCard>;
}
