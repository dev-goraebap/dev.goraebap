import { useInfiniteQuery } from '@tanstack/react-query';
import { useIsMobile } from '@/shared/lib/use-mobile';
import { useAddressFilters } from '@/shared/lib/list-address';
import { cn } from 'cn';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Button } from '@/shared/ui/button';
import { FilterBar, FilterChips, FilterMenu, useFilters } from '@/shared/ui/filter';
import { CircleCheckIcon, HistoryIcon, MessageCircleIcon, PencilIcon, PlusIcon, TrashIcon, TriangleAlertIcon, type Icon } from '@/shared/ui/icon';
import { Page } from '@/shared/ui/page';
import { PageState } from '@/shared/ui/page-state';
import { PersonAvatar } from '@/shared/ui/person-avatar';
import { Skeleton } from '@/shared/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/tooltip';
import { activityQueries, conditionsOf, exactText, filterKeys, filters, groupByDay, kinds, onePeriod, relativeText, useActivityApi,
  type Activity, type ActivityKind } from '../entities/activity';
import { ListMore } from '@/shared/ui/list-more';

/** 종류의 표식. */
const marks: Record<ActivityKind, Icon> = { create: PlusIcon, edit: PencilIcon, comment: MessageCircleIcon, approve: CircleCheckIcon, delete: TrashIcon };

/**
 * 활동 기록: 시간순 읽기 전용 타임라인. 툴바의 필터(기간 · 사람 · 종류)와 확정한 조건은 주소가 가진다. 날짜로 나누고 줄마다
 * 누가 · 무엇을 · 언제를 보이며, 시각은 상대 표시에 정확한 시각을 툴팁으로 둔다. 끝없이 불러오지 않고 목록 아래 "전체 중 읽은 수"와
 * 더 보기로 조각씩 읽는다. 상태 순서: 대기 → 실패(다시 시도) → 조건이 있는 0건(조건 지우기) → 0건.
 */
export function ActivityPage() {
  const api = useActivityApi();
  const isMobile = useIsMobile();
  const [state, setState] = useAddressFilters(filterKeys);
  const list = useFilters(filters, { state, onStateChange: next => setState(onePeriod(next, state)) });
  const conditions = conditionsOf(state);
  const hasConditions = !!conditions.period || conditions.actors.length > 0 || conditions.kinds.length > 0;
  const query = useInfiniteQuery(activityQueries.list(api, conditions));
  const items = query.data?.pages.flatMap(page => page.items) ?? [];
  const total = query.data?.pages[query.data.pages.length - 1]?.total ?? 0;
  const content = () => {
    if (query.isPending) return <TimelineSkeleton />;
    if (query.isError && !query.data) return <PageState kind="error" title="활동 기록을 불러오지 못했습니다" description="잠시 후 다시 시도해 주세요."
      action={<Button variant="secondary" onClick={() => void query.refetch()}>다시 시도</Button>} />;
    if (items.length === 0 && hasConditions) return <PageState kind="search" title="조건에 맞는 활동이 없습니다" description="기간이나 사람, 종류를 바꿔 보세요."
      action={<Button variant="secondary" onClick={list.clear}>조건 지우기</Button>} />;
    if (items.length === 0) return <PageState kind="empty" title="아직 활동이 없습니다" description="문서를 만들거나 고치면 여기에 기록됩니다." />;
    return <div className="flex flex-1 flex-col bg-background">
      <div aria-busy={query.isPlaceholderData || undefined} className="mx-auto w-full max-w-180 px-4 py-6 transition-opacity aria-busy:opacity-60 md:py-8">
        {groupByDay(items).map(day => <section key={day.key} aria-labelledby={`day-${day.key}`}>
          <h2 id={`day-${day.key}`} className="sticky top-0 z-1 bg-background pt-4 pb-3 text-sm font-semibold text-muted-foreground">{day.label}</h2>
          <ol aria-label={day.label} className="flex flex-col">{day.items.map(item => <Row key={item.id} item={item} />)}</ol>
        </section>)}
      </div>
      <ListMore shown={items.length} total={total} unit="건" hasMore={!!query.hasNextPage} isLoading={query.isFetchingNextPage} onMore={() => void query.fetchNextPage()} />
    </div>;
  };
  return <Page crumbs={[{ label: '활동 기록', icon: HistoryIcon }]} tools={<FilterMenu filters={list} />}
    below={<>
      {isMobile ? <FilterChips filters={list} /> : <FilterBar filters={list} />}
      {query.isError && query.data ? <Alert variant="destructive" className="shrink-0 rounded-none border-x-0 border-t-0">
        <TriangleAlertIcon />
        <AlertTitle>활동 기록을 새로 읽지 못했습니다</AlertTitle>
        <AlertDescription>보이는 목록은 마지막으로 읽은 내용입니다.</AlertDescription>
      </Alert> : null}
    </>}>
    {content()}
  </Page>;
}

/** 세로선 하나에 이어진 칸: 선 위의 종류 표식, 아바타와 한 문장, 줄 끝의 때. 첫 칸 위 · 끝 칸 아래는 선을 그리지 않는다. */
const RAIL = 'relative before:absolute before:top-0 before:left-2.5 before:h-1.5 before:w-px before:bg-input after:absolute after:top-7.5 after:bottom-0 after:left-2.5 after:w-px after:bg-input first:before:hidden last:after:hidden';

/** 한 줄: 사람 · 무엇을 했는지 · 상대 시각(가리키거나 초점을 두면 정확한 시각). */
function Row({ item }: { item: Activity }) {
  const Mark = marks[item.kind];
  return <li className={cn(RAIL, 'grid grid-cols-[1.25rem_minmax(0,1fr)_auto] items-start gap-x-3 py-1.5')}>
    <span aria-hidden className="grid size-5 place-items-center pt-0.5 text-icon-muted"><Mark className="size-4" /></span>
    <p className="flex min-w-0 items-start gap-2 text-sm/6">
      <PersonAvatar name={item.actor} className="mt-0.5" />
      <span className="min-w-0 break-keep wrap-anywhere">
        <b className="font-semibold">{item.actor}</b>님이 <b className="font-semibold">"{item.target}"</b> {kinds[item.kind].verb}
      </span>
    </p>
    <Tooltip>
      <TooltipTrigger render={<time dateTime={item.at} tabIndex={0} />}
        className="rounded-sm text-xs/6 whitespace-nowrap text-muted-foreground tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring">
        {relativeText(item.at)}
      </TooltipTrigger>
      <TooltipContent>{exactText(item.at)}</TooltipContent>
    </Tooltip>
  </li>;
}


/** 읽는 동안: 줄 모양의 자리. */
function TimelineSkeleton() {
  return <div aria-busy="true" aria-label="활동 기록을 불러오는 중" className="mx-auto flex w-full max-w-180 flex-col gap-3 px-4 py-8">
    <Skeleton className="h-4 w-16" />
    {Array.from({ length: 8 }, (_, index) => <div key={index} className="flex items-center gap-3">
      <Skeleton className="size-5 rounded-full" /><Skeleton className="h-4 flex-1" /><Skeleton className="h-4 w-12" />
    </div>)}
  </div>;
}
