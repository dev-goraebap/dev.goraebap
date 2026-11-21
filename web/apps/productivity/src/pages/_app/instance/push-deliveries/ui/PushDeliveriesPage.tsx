import { useNavigate, useSearch } from '@tanstack/react-router';
import { useState } from 'react';
import { useAddressFilters, useAddressWords } from '@/shared/lib/list-address';
import { useIsMobile } from '@/shared/lib/use-mobile';
import { FilterBar, FilterChips, FilterMenu, useFilters, type FilterDef } from '@/shared/ui/kit/filter';
import { BellIcon, SentIcon } from '@/shared/ui/kit/icon';
import { Page, PageViews, type PageView } from '@/shared/ui/kit/layout/page';
import { SearchTool } from '@/shared/ui/kit/search-tool';
import { pageCrumbs } from '@/shared/ui/nav-icon';
import type { PushMember } from '../api/push';
import { NoticeKindsTab } from './NoticeKindsTab';
import { PushDeliveriesTab } from './PushDeliveriesTab';

type Crumb = { label: string; href?: string; icon?: string };
type Tab = 'deliveries' | 'kinds';
const VIEWS: PageView<Tab>[] = [{ value: 'deliveries', label: '발송 현황', icon: SentIcon }, { value: 'kinds', label: '알림 종류', icon: BellIcon }];
const FILTER_KEYS = ['state'] as const;
const FILTERS: FilterDef<typeof FILTER_KEYS[number]>[] = [
  { key: 'state', label: '상태', icon: BellIcon, options: [{ value: 'FAILED', label: '실패 있음' }, { value: 'NO_DEVICE', label: '기기 없음' }] },
];

/**
 * 알림 발송 현황 (client/'s push deliveries), for 인스턴스 관리자, in two tabs kept in the address (?tab=kinds): 발송 현황,
 * whether browser pushes reach people, and 알림 종류, what each kind of notice is and how much of it went out.
 */
export function PushDeliveriesPage({ crumbs }: { crumbs: Crumb[] }) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const search = useSearch({ strict: false }) as { tab?: string };
  const tab: Tab = search.tab === 'kinds' ? 'kinds' : 'deliveries';
  const [words, setWords] = useAddressWords();
  const [opened, setOpened] = useState<PushMember | null>(null);
  const [address, setAddress] = useAddressFilters(FILTER_KEYS);
  // 상태는 하나만 고른다(서버가 하나를 받는다): 다른 값을 고르면 바뀌고, 고른 값을 다시 누르면 풀린다.
  const filters = useFilters(FILTERS, { state: address, onStateChange: next => setAddress({ state: next.state?.slice(-1) ?? [] }) });
  const listing = { q: words.trim() || undefined, state: filters.state.state?.[0] };
  return <Page crumbs={pageCrumbs(crumbs)}
    views={<PageViews label="알림 발송 현황 보기" views={VIEWS} value={tab}
      onChange={next => void navigate({ href: next === 'kinds' ? '/instance/push-deliveries?tab=kinds' : '/instance/push-deliveries', replace: true })} />}
    tools={tab === 'deliveries' ? <><SearchTool label="구성원 검색" placeholder="이름" value={words} onChange={setWords} /><FilterMenu filters={filters} /></> : undefined}
    below={tab === 'deliveries' ? (isMobile ? <FilterChips filters={filters} /> : <FilterBar filters={filters} />) : undefined}>
    {/* 발송 현황도 종류 탭과 같은 폭(52rem)으로 가운데 둔다. */}
    <div className="mx-auto flex min-h-0 w-full max-w-208 flex-1 flex-col">{tab === 'kinds'
      ? <NoticeKindsTab />
      : <PushDeliveriesTab listing={listing} isNarrowed={!!listing.q || filters.active.length > 0} onClear={() => { setWords(''); filters.clear(); }}
        opened={opened} onOpen={setOpened} />}</div>
  </Page>;
}
