import {Timeline,TimelineItem} from '@/shared/ui/composites/activity/ActivityFeed';
import {HStack} from '@astryxdesign/core/HStack';
import {icon} from '@/shared/ui/foundations/icons/solar-icon';
import { PersonAvatar as Avatar } from '@/shared/ui/foundations/avatar/PersonAvatar';
import { Button } from '@astryxdesign/core/Button';
import { Center } from '@astryxdesign/core/Center';
import { Spinner } from '@astryxdesign/core/Spinner';
import { Text } from '@astryxdesign/core/Text';
import { Tooltip } from '@astryxdesign/core/Tooltip';
import { useFilters } from '@/shared/ui/composites/filter/use-filters';
import { PageState } from '@/shared/ui/composites/state/PageState';
import { Page } from '@/shared/ui/layouts/page/Page';
import { PageBanner, PageMore } from '@/shared/ui/layouts/page/PageParts';
import { useAddressFilters } from '@/shared/ui/patterns/list/list-address';
import { useInfiniteQuery } from '@tanstack/react-query';
import { activityQueries, conditionsOf, exactText, filters, groupByDay, kinds, relativeText, useActivityApi, type Activity } from '../entities/activity';
import styles from './activity.module.css';

/**
 * 활동 기록: 시간순 읽기 전용 타임라인. 머리 줄의 필터(기간·사람·종류)와 확정한 조건은 주소가 가진다. 날짜로 나누고 줄마다
 * 누가·무엇을·언제를 보이며, 시각은 상대 표시에 정확한 시각을 툴팁으로 둔다. 끝없이 불러오지 않고 목록 아래 "전체 중 읽은 수"와
 * 더 보기로 조각씩 읽는다. 상태 순서: 대기 → 실패(다시 시도) → 조건이 있는 0건(조건 지우기) → 0건.
 */
export function ActivityPage() {
  const api = useActivityApi();
  const [state, setState] = useAddressFilters(filters);
  const list = useFilters(filters, { state, onStateChange: setState });
  const conditions = conditionsOf(state);
  const hasConditions = !!conditions.period || conditions.actors.length > 0 || conditions.kinds.length > 0;
  const query = useInfiniteQuery(activityQueries.list(api, conditions));
  const items = query.data?.pages.flatMap(page => page.items) ?? [];
  const total = query.data?.pages[query.data.pages.length - 1]?.total ?? 0;
  const content = () => {
    if (query.isPending) return <Center height="100%"><Spinner label="활동 기록을 불러오는 중" /></Center>;
    if (query.isError && !query.data) return <PageState kind="error" title="활동 기록을 불러오지 못했습니다" description="잠시 후 다시 시도해 주세요."
      action={<Button label="다시 시도" variant="secondary" onClick={() => void query.refetch()} />} />;
    if (items.length === 0 && hasConditions) return <PageState kind="search" title="조건에 맞는 활동이 없습니다" description="기간이나 사람, 종류를 바꿔 보세요."
      action={<Button label="조건 지우기" variant="secondary" onClick={list.clear} />} />;
    if (items.length === 0) return <PageState kind="empty" title="아직 활동이 없습니다" description="문서를 만들거나 고치면 여기에 기록됩니다." />;
    return <>
      <div className={styles.timeline} aria-busy={query.isPlaceholderData || undefined}>
        {groupByDay(items).map(day => <section key={day.key} className={styles.day}>
          <h2 className={styles.dayLabel}>{day.label}</h2>
          <Timeline label={day.label}>{day.items.map(item => <Row key={item.id} item={item} />)}</Timeline>
        </section>)}
      </div>
      <div className={styles.more}><PageMore shown={items.length} total={total} unit="건" hasMore={!!query.hasNextPage} isLoading={query.isFetchingNextPage} onMore={() => void query.fetchNextPage()} /></div>
    </>;
  };
  return <Page crumbs={[{ label: '활동 기록' }]} tools={list.tools} applied={list.applied}>
    {query.isError && query.data ? <PageBanner status="error" title="활동 기록을 새로 읽지 못했습니다" description="보이는 목록은 마지막으로 읽은 내용입니다." /> : null}
    {content()}
  </Page>;
}

/** 한 줄: 사람 · 무엇을 했는지 · 상대 시각(툴팁은 정확한 시각). */
function Row({ item }: { item: Activity }) {
  return <TimelineItem mark={icon(({create:'plus',edit:'edit',comment:'comment',approve:'check',delete:'delete'} as const)[item.kind])}><HStack className={styles.row} gap={2} vAlign="start">
    <Avatar name={item.actor} size="xsm" shape="circle" />
    <Text className={styles.sentence}>
      <Text weight="semibold">{item.actor}</Text>님이 <span className={styles.target}>"{item.target}"</span> {kinds[item.kind].verb}
    </Text>
    <Tooltip content={exactText(item.at)}>
      <time className={styles.when} dateTime={item.at} tabIndex={0}><Text type="supporting" color="secondary" hasTabularNumbers textWrap="nowrap">{relativeText(item.at)}</Text></time>
    </Tooltip>
  </HStack></TimelineItem>;
}
