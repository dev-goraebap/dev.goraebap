import { useMutation } from '@tanstack/react-query';
import { Button } from '@/shared/ui/button';
import { FileTextIcon } from '@/shared/ui/icon';
import { PageState } from '@/shared/ui/page-state';
import { Spinner } from '@/shared/ui/spinner';
import { useSessionApi } from '../../entities/session';

/**
 * 점검 중. 앱 셸에 들어갈 수 없는 상태라서 셸 없이 전체 화면에 표시와 상태 화면만 둔다. 다시 시도하면 서비스 상태를
 * 확인해 열렸으면 앱으로 돌아가고, 아직이면 그 자리에서 알린다.
 */
export function MaintenancePage({ onReopened }: { onReopened: () => void }) {
  const api = useSessionApi();
  const check = useMutation({
    mutationFn: () => api.checkService(),
    onSuccess: status => { if (status === 'up') onReopened(); },
  });
  const isStillDown = check.data === 'maintenance';
  return <main className="flex h-full flex-col bg-background">
    <div className="flex h-13 shrink-0 items-center gap-2 px-4 font-semibold"><FileTextIcon chosen className="size-5" />작업 공간</div>
    <div className="flex min-h-0 flex-1 flex-col">
      <PageState kind="error" title="점검 중입니다" description="서비스를 점검하고 있습니다. 잠시 후 다시 시도해 주세요."
        action={<div className="flex flex-col items-center gap-3">
          <Button variant="secondary" className="max-md:h-11" disabled={check.isPending} onClick={() => check.mutate()}>
            {check.isPending && <Spinner data-icon="inline-start" />}다시 시도
          </Button>
          {isStillDown ? <p role="status" className="text-sm text-muted-foreground">아직 점검 중입니다.</p> : null}
          {check.isError ? <p role="alert" className="text-sm text-muted-foreground">상태를 확인하지 못했습니다. 다시 시도해 주세요.</p> : null}
        </div>} />
    </div>
  </main>;
}
