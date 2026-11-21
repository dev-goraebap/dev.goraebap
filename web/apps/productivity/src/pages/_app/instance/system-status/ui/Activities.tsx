import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { cn } from 'cn';
import { useIsMobile } from '@/shared/lib/use-mobile';
import { Button } from '@/shared/ui/kit/button';
import { ListMore } from '@/shared/ui/kit/list-more';
import { PageState } from '@/shared/ui/kit/page-state';
import { WithPanel } from '@/shared/ui/kit/side-panel';
import { ToneBadge } from '@/shared/ui/tone-badge';
import { activitiesOptions, isLogUnavailable, type ActivityListing, type ActivityRow } from '../api/system';
import { activityOutcome, activityText, momentText } from '../model/format';
import { ActivityFactsPanel } from './ActivityFactsPanel';
import { ActivityTable } from './ActivityTable';
import { LogStoreNotice } from './LogStoreNotice';

const ROW = 'relative bg-background hover:bg-row-hover data-[state=selected]:bg-muted';
const OPENS_ROW = 'min-w-0 truncate text-left outline-none after:absolute after:inset-0 focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-ring';
const whoOf = (row: ActivityRow) => row.employeeName ?? (row.employeeId ? '알 수 없는 구성원' : '로그인 전');

/**
 * 활동 기록: what members did over the last 30 days, newest first (every change, sign-ins and the reads worth keeping,
 * and the main screens they opened, again within 30 minutes of the last time on the same line), narrowed by the page's
 * conditions. A desktop shows a table, a phone rows; a row opens everything kept of it.
 */
export function Activities({ listing, isNarrowed, onClear, opened, onOpen }: {
  listing: ActivityListing; isNarrowed: boolean; onClear: () => void; opened: ActivityRow | null; onOpen: (row: ActivityRow | null) => void;
}) {
  const isMobile = useIsMobile();
  const list = useInfiniteQuery(activitiesOptions(listing));
  const items = useMemo(() => list.data?.pages.flatMap(page => page.items) ?? [], [list.data]);
  if (isLogUnavailable(list.error)) return <div className="p-6 max-md:p-4"><LogStoreNotice /></div>;
  if (list.isPending) return null;
  if (list.isError) return <PageState kind="error" title="활동 기록을 불러오지 못했습니다" description={list.error.message}
    action={<Button variant="secondary" onClick={() => void list.refetch()}>다시 시도</Button>} />;
  if (items.length === 0) return isNarrowed
    ? <PageState kind="search" title="조건에 맞는 활동이 없습니다" action={<Button variant="secondary" onClick={onClear}>조건 지우기</Button>} />
    : <PageState kind="empty" title="아직 남은 활동이 없습니다" />;
  return <WithPanel title={opened ? activityText(opened).title : undefined} subtitle={opened ? momentText(opened.at) : undefined}
    panel={opened ? <ActivityFactsPanel row={opened} /> : undefined} onClose={() => onOpen(null)}>
    {isMobile
      ? <ul aria-label="활동 기록" className="flex flex-col">
        {items.map(row => {
          const text = activityText(row);
          const outcome = activityOutcome(row);
          return <li key={`${row.kind}-${row.id}`} data-state={opened?.id === row.id && opened.kind === row.kind ? 'selected' : undefined}
            className={cn(ROW, 'flex items-center gap-3 border-b px-4 py-3')}>
            <span className="flex min-w-0 flex-1 flex-col">
              <button type="button" className={cn(OPENS_ROW, 'font-medium')} onClick={() => onOpen(row)}>{`${whoOf(row)} · ${text.title}`}</button>
              <span className={cn('truncate text-sm text-muted-foreground', row.kind === 'CHANGE' && 'font-mono text-xs')}>{text.detail}</span>
            </span>
            <span className="flex shrink-0 flex-col items-end gap-0.5">
              <ToneBadge label={outcome.label} tone={outcome.color} />
              <span className="text-xs text-muted-foreground tabular-nums">{momentText(row.at)}</span>
            </span>
          </li>;
        })}
      </ul>
      : <ActivityTable rows={items} opened={opened} onOpen={onOpen} />}
    <ListMore shown={items.length} hasMore={!!list.hasNextPage && !list.isPlaceholderData} isLoading={list.isFetchingNextPage} onMore={() => void list.fetchNextPage()} />
  </WithPanel>;
}
