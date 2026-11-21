import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useState } from 'react';
import { orgChartOptions } from '@/entities/organization';
import { useAddressFilters, useAddressWords } from '@/shared/lib/list-address';
import { useIsMobile } from '@/shared/lib/use-mobile';
import { pageCrumbs } from '@/shared/ui/nav-icon';
import { FilterBar, FilterChips, FilterMenu, useFilters, type FilterDef, type FilterState, type Filters } from '@/shared/ui/kit/filter';
import { CalendarIcon, CircleCheckIcon, ClockIcon, DashboardIcon, EyeIcon, TriangleAlertIcon, UserIcon } from '@/shared/ui/kit/icon';
import { Page, PageViews, type PageView } from '@/shared/ui/kit/layout/page';
import { SearchTool } from '@/shared/ui/kit/search-tool';
import { SegmentedControl } from '@/shared/ui/kit/segmented-control';
import type { ActivityRow, ErrorRow, TrafficRange } from '../api/system';
import { DAY_SPANS, spanRange } from '../model/format';
import { Overview } from './Overview';
import { Activities } from './Activities';
import { Errors } from './Errors';

type Crumb = { label: string; href?: string; icon?: string };
type Tab = 'overview' | 'activities' | 'errors';
const VIEWS: PageView<Tab>[] = [
  { value: 'overview', label: '개요', icon: DashboardIcon },
  { value: 'activities', label: '활동 기록', icon: ClockIcon },
  { value: 'errors', label: '서버 오류', icon: TriangleAlertIcon },
];
const RANGES: { value: TrafficRange; label: string }[] = [{ value: 'DAY', label: '24시간' }, { value: 'WEEK', label: '7일' }, { value: 'MONTH', label: '30일' }];
const ACTIVITY_KEYS = ['who', 'kind', 'outcome', 'days'] as const;
const ERROR_KEYS = ['level', 'days'] as const;

/** Each of these filters holds one value (the server takes one): picking another replaces it, picking it again clears it. */
const single = <K extends string>(next: FilterState<K>): FilterState<K> =>
  Object.fromEntries(Object.entries(next).map(([key, values]) => [key, (values as string[] | undefined)?.slice(-1) ?? []])) as FilterState<K>;

/**
 * 시스템 현황 (client/'s instance system), for 인스턴스 관리자, in three tabs kept in the address (?tab=, and the overview's
 * ?range=): 개요, the server now and its use over 24 hours, 7 or 30 days in charts; 활동 기록, what members changed and
 * which main screens they opened, found by words in the path or screen and narrowed by member, kind, outcome and days;
 * 서버 오류, what the server could not handle, narrowed by level and days. A record opens beside the list (a sheet on a
 * phone). Records are kept 30 days.
 */
export function SystemStatusPage({ crumbs }: { crumbs: Crumb[] }) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const search = useSearch({ strict: false }) as { tab?: string; range?: string };
  const tab: Tab = search.tab === 'activities' || search.tab === 'errors' ? search.tab : 'overview';
  const range: TrafficRange = search.range === 'WEEK' || search.range === 'MONTH' ? search.range : 'DAY';
  const go = (next: { tab?: Tab; range?: TrafficRange }) => {
    const query = new URLSearchParams(window.location.search);
    if (next.tab) { if (next.tab === 'overview') query.delete('tab'); else query.set('tab', next.tab); }
    if (next.range) { if (next.range === 'DAY') query.delete('range'); else query.set('range', next.range); }
    void navigate({ href: `/instance/system-status${query.size ? `?${query}` : ''}`, replace: true });
  };
  const chart = useQuery({ ...orgChartOptions(), enabled: tab === 'activities' });
  const [words, setWords] = useAddressWords();
  const [activity, setActivity] = useState<ActivityRow | null>(null);
  const [error, setError] = useState<ErrorRow | null>(null);
  const [activityAddress, setActivityAddress] = useAddressFilters(ACTIVITY_KEYS);
  const [errorAddress, setErrorAddress] = useAddressFilters(ERROR_KEYS);
  const activityDefs: FilterDef<typeof ACTIVITY_KEYS[number]>[] = [
    { key: 'who', label: '구성원', icon: UserIcon, isSearchable: true,
      options: (chart.data?.people ?? []).map(person => ({ value: person.id, label: person.name })).sort((left, right) => left.label.localeCompare(right.label, 'ko')) },
    { key: 'kind', label: '종류', icon: EyeIcon, options: [{ value: 'CHANGE', label: '바꾼 일' }, { value: 'VISIT', label: '화면 열람' }] },
    { key: 'outcome', label: '결과', icon: CircleCheckIcon, options: [{ value: 'SUCCESS', label: '성공' }, { value: 'REFUSED', label: '거절됨' }, { value: 'FAILED', label: '서버 오류' }] },
    { key: 'days', label: '기간', icon: CalendarIcon, options: DAY_SPANS },
  ];
  const errorDefs: FilterDef<typeof ERROR_KEYS[number]>[] = [
    { key: 'level', label: '수준', icon: TriangleAlertIcon, options: [{ value: 'ERROR', label: '오류' }, { value: 'WARN', label: '경고' }] },
    { key: 'days', label: '기간', icon: CalendarIcon, options: DAY_SPANS },
  ];
  const activityFilters = useFilters(activityDefs, { state: activityAddress, onStateChange: next => setActivityAddress(single(next)) });
  const errorFilters = useFilters(errorDefs, { state: errorAddress, onStateChange: next => setErrorAddress(single(next)) });
  const kind = activityFilters.state.kind?.[0];
  // An outcome is a change's alone.
  const activityListing = {
    employeeId: activityFilters.state.who?.[0], kind, outcome: kind === 'VISIT' ? undefined : activityFilters.state.outcome?.[0],
    q: words.trim() || undefined, ...spanRange(activityFilters.state.days?.[0]),
  };
  const errorListing = { level: errorFilters.state.level?.[0], ...spanRange(errorFilters.state.days?.[0]) };
  const applied = <K extends string>(filters: Filters<K>) => (isMobile ? <FilterChips filters={filters} /> : <FilterBar filters={filters} />);
  const tools = tab === 'overview'
    ? <SegmentedControl label="기간" value={range} onChange={value => go({ tab, range: value })} options={RANGES} />
    : tab === 'activities'
      ? <><SearchTool label="경로 검색" placeholder="API 경로나 화면 (meetings …)" value={words} onChange={setWords} /><FilterMenu filters={activityFilters} /></>
      : <FilterMenu filters={errorFilters} />;
  // A phone shows the tabs as icons: beside the overview's range they would run off the row, hiding 서버 오류.
  return <Page crumbs={pageCrumbs(crumbs)} views={<PageViews label="시스템 현황 보기" views={VIEWS} value={tab} onChange={next => go({ tab: next })} isCompact={isMobile} />} tools={tools}
    below={tab === 'activities' ? applied(activityFilters) : tab === 'errors' ? applied(errorFilters) : undefined}>
    {/* 차트와 기록 목록이 읽기 좋은 폭(64rem)으로 가운데 둔다. 넓은 화면 끝까지 펼치면 눈이 오가는 거리가 너무 길다. */}
    <div className="mx-auto flex min-h-0 w-full max-w-256 flex-1 flex-col">{tab === 'activities'
      ? <Activities listing={activityListing} isNarrowed={!!activityListing.q || activityFilters.active.length > 0} opened={activity} onOpen={setActivity}
        onClear={() => { setWords(''); activityFilters.clear(); }} />
      : tab === 'errors'
        ? <Errors listing={errorListing} isNarrowed={errorFilters.active.length > 0} opened={error} onOpen={setError} onClear={errorFilters.clear} />
        : <Overview range={range} />}</div>
  </Page>;
}
