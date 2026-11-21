import { Dialog, DialogBar, DialogContent } from '@/shared/ui/kit/dialog';
import { Spinner } from '@/shared/ui/kit/spinner';

/**
 * 목록 위 대화상자의 내용을 준비하는 동안의 자리. 상세 대화상자(shared/ui/detail-surface)와 같은 자리 · 폭 · 머리로 띄워,
 * 내용이 오면 PanelHost가 화면 전환(swapDialog)으로 겹쳐 바꾼다. 닫으면 대화상자를 연 페이지로 돌아간다.
 */
export function PanelLoading({ onClose }: { href?: string; onClose: () => void }) {
  return <Dialog open onOpenChange={isOpen => { if (!isOpen) onClose(); }}>
    <DialogContent showCloseButton={false} className="min-h-[min(24rem,76dvh)]">
      <DialogBar title="불러오는 중" />
      <div className="flex min-h-56 flex-1 items-center justify-center">
        <Spinner className="size-5 text-muted-foreground" aria-label="내용을 불러오는 중" />
      </div>
    </DialogContent>
  </Dialog>;
}
