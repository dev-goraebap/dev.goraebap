import { cn } from 'cn';
import { Badge } from '@/shared/ui/kit/badge';
import { BranchIcon } from '@/shared/ui/kit/icon';
import { LazyTooltip } from '@/shared/ui/popup';

/** 저장된 웹훅 상태의 요약이다. 외부 호스트에 카드마다 조회하지 않는다. 열린 것이 있으면 진행 색, 병합만 남았으면 완료 색으로 읽힌다. */
export function WorkItemPullRequests({ counts }: { counts?: { open?: number; draft?: number; merged?: number; closed?: number } }) {
  const opened = counts?.open ?? 0; const draft = counts?.draft ?? 0; const merged = counts?.merged ?? 0; const closed = counts?.closed ?? 0;
  const total = opened + draft + merged + closed;
  if (!total) return null;
  const label = `PR ${total}개: 열림 ${opened}, 초안 ${draft}, 병합 ${merged}, 닫힘 ${closed}`;
  const tone = opened ? 'text-mark-progress' : draft ? 'text-icon-muted' : merged ? 'text-mark-done' : 'text-destructive';
  return <LazyTooltip content={label}>
    <Badge variant="label" role="img" aria-label={label} className="relative z-1">
      <BranchIcon className={cn(tone)} />
      PR {total}
    </Badge>
  </LazyTooltip>;
}
