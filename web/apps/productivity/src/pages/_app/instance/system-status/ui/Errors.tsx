import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { cn } from 'cn';
import { Badge } from '@/shared/ui/kit/badge';
import { Button } from '@/shared/ui/kit/button';
import { ListMore } from '@/shared/ui/kit/list-more';
import { PageState } from '@/shared/ui/kit/page-state';
import { WithPanel } from '@/shared/ui/kit/side-panel';
import { errorsOptions, isLogUnavailable, type ErrorListing, type ErrorRow } from '../api/system';
import { momentText } from '../model/format';
import { ErrorFactsPanel } from './ErrorFactsPanel';
import { LogStoreNotice } from './LogStoreNotice';

const ROW = 'relative bg-background hover:bg-row-hover data-[state=selected]:bg-muted';
const OPENS_ROW = 'min-w-0 truncate text-left outline-none after:absolute after:inset-0 focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-ring';

/**
 * 서버 오류: what the server logged as errors (and its own code's warnings) over the last 30 days, newest first, the same
 * error within a minute one line with its count; a line opens its stack.
 */
export function Errors({ listing, isNarrowed, onClear, opened, onOpen }: {
  listing: ErrorListing; isNarrowed: boolean; onClear: () => void; opened: ErrorRow | null; onOpen: (row: ErrorRow | null) => void;
}) {
  const list = useInfiniteQuery(errorsOptions(listing));
  const items = useMemo(() => list.data?.pages.flatMap(page => page.items) ?? [], [list.data]);
  if (isLogUnavailable(list.error)) return <div className="p-6 max-md:p-4"><LogStoreNotice /></div>;
  if (list.isPending) return null;
  if (list.isError) return <PageState kind="error" title="서버 오류 기록을 불러오지 못했습니다" description={list.error.message}
    action={<Button variant="secondary" onClick={() => void list.refetch()}>다시 시도</Button>} />;
  if (items.length === 0) return isNarrowed
    ? <PageState kind="search" title="조건에 맞는 오류가 없습니다" action={<Button variant="secondary" onClick={onClear}>조건 지우기</Button>} />
    : <PageState kind="empty" title="최근 30일 동안 서버 오류가 없습니다" />;
  return <WithPanel title={opened ? (opened.level === 'ERROR' ? '서버 오류' : '서버 경고') : undefined} subtitle={opened ? momentText(opened.lastAt) : undefined}
    panel={opened ? <ErrorFactsPanel row={opened} /> : undefined} onClose={() => onOpen(null)}>
    <ul aria-label="서버 오류" className="flex flex-col">
      {items.map(row => <li key={row.id} data-state={opened?.id === row.id ? 'selected' : undefined} className={cn(ROW, 'flex items-center gap-3 border-b px-4 py-3')}>
        {row.level === 'ERROR'
          ? <Badge className="bg-event-red text-event-red-foreground">오류</Badge>
          : <Badge className="bg-event-orange text-event-orange-foreground">경고</Badge>}
        <span className="flex min-w-0 flex-1 flex-col">
          <button type="button" className={cn(OPENS_ROW, 'font-medium')} onClick={() => onOpen(row)}>{row.message}</button>
          <span className="truncate font-mono text-xs text-muted-foreground">
            {row.method && row.path ? `${row.method} ${row.path}` : row.logger}{row.exception ? ` · ${row.exception.split('.').pop()}` : ''}
          </span>
        </span>
        <span className="flex shrink-0 flex-col items-end">
          <span className="text-xs tabular-nums">{momentText(row.lastAt)}</span>
          {row.occurrences > 1 ? <span className="text-xs text-muted-foreground tabular-nums">{row.occurrences}번</span> : null}
        </span>
      </li>)}
    </ul>
    <ListMore shown={items.length} hasMore={!!list.hasNextPage && !list.isPlaceholderData} isLoading={list.isFetchingNextPage} onMore={() => void list.fetchNextPage()} />
  </WithPanel>;
}
