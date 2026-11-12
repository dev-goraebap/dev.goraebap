import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { ArchiveIcon, ArchiveUpIcon, FileTextIcon } from '@/shared/ui/icon';
import { Spinner } from '@/shared/ui/spinner';
import { kinds, timeText, type Notification } from '../entities/notification';

/**
 * 알림의 내용: 무엇이 왔는지(종류 · 시각 · 제목 · 본문), 가리키는 대상, 보관 동작. 목록 옆 상세 칸과 자기 페이지가 같은 부품을
 * 쓴다. 휴대폰과 직접 진입은 페이지로, 데스크톱 목록은 상세 칸으로 보인다. 읽는 폭은 45rem.
 */
export function NotificationView({ item, headingLevel = 1, isBusy, onToggleArchive }: {
  item: Notification; headingLevel?: 1 | 2; isBusy: boolean; onToggleArchive: () => void;
}) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2';
  return <article className="mx-auto flex w-full max-w-180 flex-col gap-4 px-4 py-5 break-keep wrap-anywhere md:py-6">
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Badge variant="secondary">{kinds[item.kind].label}</Badge>
        <span className="text-xs text-muted-foreground tabular-nums">{timeText(item.sentAt)}</span>
      </div>
      <Heading className="text-xl font-semibold text-balance">{item.title}</Heading>
    </div>
    <p className="leading-relaxed">{item.body}</p>
    <section aria-label="알림이 가리키는 내용" className="flex flex-col gap-1 rounded-xl border bg-card px-4 py-3">
      <p className="flex min-w-0 items-center gap-2 font-semibold"><FileTextIcon className="shrink-0 text-icon-muted" /><span className="truncate">{item.subject}</span></p>
      <p className="text-sm text-muted-foreground">{item.excerpt}</p>
    </section>
    <div>
      <Button variant="secondary" className="max-md:h-11 max-md:px-4" disabled={isBusy} onClick={onToggleArchive}>
        {isBusy ? <Spinner data-icon="inline-start" /> : item.archived ? <ArchiveUpIcon data-icon="inline-start" /> : <ArchiveIcon data-icon="inline-start" />}
        {item.archived ? '받은함으로 옮기기' : '보관하기'}
      </Button>
    </div>
  </article>;
}
