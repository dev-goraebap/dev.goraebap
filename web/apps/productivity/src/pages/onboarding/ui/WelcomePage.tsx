import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sendCommand } from '@/shared/api';
import { isAdministrator, sessionOptions } from '@/shared/auth';
import { BrandMark } from '@/shared/ui/brand';
import { Button } from '@goraebap/ui-react/compact/button';
import { Card } from '@goraebap/ui-react/compact/card';
import { FolderIcon, UsersIcon, UserIcon } from '@/shared/ui/kit/icon';
import { Spinner } from '@goraebap/ui-react/components/spinner';

type Step = { icon: typeof UserIcon; title: string; detail: string };

const ADMIN_STEPS: Step[] = [
  { icon: FolderIcon, title: '프로젝트 만들기', detail: '워크스페이스의 프로젝트 목록에서 첫 프로젝트를 만듭니다.' },
  { icon: UsersIcon, title: '구성원 추가', detail: '로고 옆 전환 › 인스턴스 관리 › 구성원 · 권한에서 함께 일할 사람을 이메일로 더합니다.' },
  { icon: UserIcon, title: '내 정보 다듬기', detail: '내 메뉴 › 내 정보에서 이름과 사진을 고칩니다.' },
];
const MEMBER_STEPS: Step[] = [
  { icon: FolderIcon, title: '프로젝트 둘러보기', detail: '내가 속한 프로젝트가 왼쪽 메뉴에 보입니다.' },
  { icon: UserIcon, title: '내 정보 다듬기', detail: '내 메뉴 › 내 정보에서 이름과 사진을 고칩니다.' },
];

/**
 * 처음 로그인한 사람의 환영: 누구로 들어왔는지와 다음에 할 일을 보이고, 시작하기를 누르면 온보딩을 마친다(그 뒤로는 다시 나오지
 * 않는다). 관리자에게는 설치를 꾸리는 순서를, 구성원에게는 둘러볼 곳을 보인다.
 */
export function WelcomePage({ onDone }: { onDone: () => void }) {
  const client = useQueryClient();
  const session = useQuery(sessionOptions()).data;
  const finish = useMutation({
    mutationFn: () => sendCommand('/api/v1/auth/onboarding', 'PUT'),
    onSuccess: async () => { await client.invalidateQueries({ queryKey: sessionOptions().queryKey }); onDone(); },
  });
  const steps = isAdministrator(session) ? ADMIN_STEPS : MEMBER_STEPS;
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-4">
      <Card className="w-120 max-w-full gap-6 rounded-(--radius-surface) px-6 shadow-xs">
        <div className="flex flex-col items-start gap-3">
          <BrandMark size="2.5rem" label="" />
          <h1 className="text-2xl font-semibold text-balance">{session?.name ? `${session.name}님, 환영합니다` : '환영합니다'}</h1>
          <p className="text-muted-foreground">{session?.email} 계정으로 들어왔습니다. 시작하기 전에 해 두면 좋은 일입니다.</p>
        </div>
        <ol className="flex flex-col gap-3">
          {steps.map(step => (
            <li key={step.title} className="flex items-start gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground [&_svg]:size-4"><step.icon /></span>
              <span className="flex min-w-0 flex-col">
                <span className="font-medium">{step.title}</span>
                <span className="text-sm text-muted-foreground">{step.detail}</span>
              </span>
            </li>
          ))}
        </ol>
        <Button className="w-full rounded-full max-md:h-11" disabled={finish.isPending} aria-busy={finish.isPending || undefined} onClick={() => finish.mutate()}>
          {finish.isPending ? <Spinner data-icon="inline-start" /> : null}
          시작하기
        </Button>
        {finish.error ? <p role="alert" className="text-muted-foreground">{finish.error.message}</p> : null}
      </Card>
    </main>
  );
}
