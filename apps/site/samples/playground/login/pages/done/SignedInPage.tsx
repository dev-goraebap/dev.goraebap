import { AuthButton, AuthCard } from '../auth-card/AuthCard';

/** 로그인 뒤 도착지를 대신하는 화면. 실제 앱은 이 자리에서 업무 화면으로 이동한다. */
export function SignedInPage({ name, onSignOut }: { name: string; onSignOut: () => void }) {
  return <AuthCard title={`${name}님, 안녕하세요`}>
    <div className="flex flex-col gap-6">
      <p role="status" className="text-muted-foreground">로그인했습니다.</p>
      <AuthButton variant="secondary" onClick={onSignOut}>로그아웃</AuthButton>
    </div>
  </AuthCard>;
}
