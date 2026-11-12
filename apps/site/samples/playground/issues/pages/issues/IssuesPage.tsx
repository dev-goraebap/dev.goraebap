import { useQuery } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { useAddressChoices, useAddressFilters, useAddressWords } from '@/shared/lib/list-address';
import { useIsMobile } from '@/shared/lib/use-mobile';
import { usePeek } from '@/shared/lib/use-peek';
import { Button } from '@/shared/ui/button';
import { DisplayChoice, DisplayMenu } from '@/shared/ui/display-menu';
import { FilterBar, FilterChips, FilterMenu, useFilters } from '@/shared/ui/filter';
import { PlusIcon, TagIcon, UserIcon } from '@/shared/ui/icon';
import { ListGroupHeader } from '@/shared/ui/list-group-header';
import { Page, PageViews } from '@/shared/ui/page';
import { PageState } from '@/shared/ui/page-state';
import { PeekLayout, PeekPanel, usePeekRows } from '@/shared/ui/peek';
import { SearchTool } from '@/shared/ui/search-tool';
import { Skeleton } from '@/shared/ui/skeleton';
import { issueQueries, me, priorities, statuses, useIssueApi } from '../../entities/issue';
import { IssueRow, PriorityMark, StatusIcon } from '../../entities/issue/ui';
import { IssuePeek } from '../issue-detail/IssueDetailPage';
import { BoardView } from './BoardView';
import { directions, displayChoices, filterKeys, filters, groups, initialDisplay, layouts, sorts, visibleIssues, type Display } from './model';
import { ListMore } from '@/shared/ui/list-more';

const PAGE = 8;
const pageOf = (id: string) => `/issues/${id}`;
const views = [{ value: 'all', label: '모든 이슈', icon: TagIcon }, { value: 'mine', label: '내 이슈', icon: UserIcon }] as const;

/**
 * 이슈 목록. 같은 조회 결과를 행 목록과 상태별 보드로 보인다(표시 메뉴의 보기, 주소가 가진다). 머리 줄: 경로 · 만들기, 툴바: 뷰 · 도구(검색 ·
 * 필터 · 표시). 걸린 필터가 있으면 툴바 아래 필터 줄. 상태 순서: 대기 → 실패(다시 시도) → 조건이 있는 0건(조건 지우기) → 0건(이슈 추가).
 * 줄 누르기는 상세 페이지, 미리보기는 줄 끝 버튼과 Space(작업 목록). 미리보기는 목록 옆 칸이고 주소의 ?peek=가 가진다.
 */
export function IssuesPage({ onCreate }: { onCreate: () => void }) {
  const api = useIssueApi();
  const isMobile = useIsMobile();
  const [words, setWords] = useAddressWords('q');
  const [state, setState] = useAddressFilters(filterKeys);
  const [display, setDisplay] = useAddressChoices<Display>(initialDisplay, displayChoices);
  const list = useFilters(filters, { state, onStateChange: setState });
  const [limit, setLimit] = useState(PAGE);
  const peek = usePeek(pageOf);
  const rows = usePeekRows(peek);
  const query = useQuery(issueQueries.all(api));
  const items = visibleIssues(query.data ?? [], words, state, display);
  const hasConditions = !!words.trim() || list.active.length > 0;
  const clearConditions = () => { setWords(''); list.clear(); };
  const isBoard = display.layout === 'board';
  const isMine = state.assignee?.length === 1 && state.assignee[0] === me;
  const peeked = peek.id ? (query.data ?? []).find(item => item.id === peek.id) : undefined;
  const content = (): ReactNode => {
    if (query.isPending) return <ListSkeleton />;
    if (query.isError && !query.data) return <PageState kind="error" title="이슈를 불러오지 못했습니다" description="잠시 후 다시 시도해 주세요."
      action={<Button variant="secondary" onClick={() => void query.refetch()}>다시 시도</Button>} />;
    if (items.length === 0 && hasConditions) return <PageState kind="search" title="조건에 맞는 이슈가 없습니다" description="검색어나 필터를 바꿔 보세요."
      action={<Button variant="secondary" onClick={clearConditions}>조건 지우기</Button>} />;
    if (items.length === 0) return <PageState kind="empty" title="아직 이슈가 없습니다" description="해야 할 일을 이슈로 남겨 보세요."
      action={<Button variant="create" onClick={onCreate}><PlusIcon data-icon="inline-start" />이슈 추가</Button>} />;
    if (isBoard) return <div className="flex min-h-0 flex-1 flex-col" {...rows}><BoardView items={items} /></div>;
    const sections = display.group === 'status'
      ? statuses.map(each => ({ id: each.id, label: each.label, icon: <StatusIcon status={each.id} />, rows: items.filter(item => item.status === each.id) }))
      : display.group === 'priority'
        ? priorities.map(each => ({ id: each.id, label: each.label, icon: <PriorityMark priority={each.id} isDecorative />, rows: items.filter(item => item.priority === each.id) }))
        : [{ id: 'all', label: '', icon: null, rows: items }];
    let left = limit;
    return <div className="flex flex-col" {...rows}>
      {sections.filter(section => section.rows.length > 0).map(section => {
        const shown = section.rows.slice(0, Math.max(left, 0));
        left -= shown.length;
        return <Group key={section.id} label={section.label} icon={section.icon} count={section.rows.length} isGrouped={display.group !== 'none'}>
          {shown.length ? <ul aria-label={section.label || '이슈'} className="flex flex-col">
            {shown.map(issue => <IssueRow key={issue.id} issue={issue} isCompact={isMobile} isPeeking={peek.id === issue.id}
              onPeek={target => (peek.id ? peek.move(target.id) : peek.open(target.id))} onAssignee={name => setState({ ...state, assignee: [name] })} />)}
          </ul> : null}
        </Group>;
      })}
      <ListMore shown={Math.min(limit, items.length)} total={items.length} unit="개" hasMore={limit < items.length} onMore={() => setLimit(limit + PAGE)} hasFab />
    </div>;
  };
  return <PeekLayout aside={peek.id ? <PeekPanel id={peek.id} title={peeked ? `${peeked.id} ${peeked.title}` : '이슈'} pageHref={pageOf(peek.id)} onClose={peek.close}>
    <IssuePeek id={peek.id} />
  </PeekPanel> : undefined}>
    <Page crumbs={[{ label: '이슈', icon: TagIcon }]}
      views={<PageViews label="이슈 뷰" views={[...views]} value={isMine ? 'mine' : 'all'} isCompact={isMobile}
        onChange={value => setState({ ...state, assignee: value === 'mine' ? [me] : [] })} />}
      tools={<>
        <SearchTool label="이슈 검색" placeholder="키와 제목에서 찾기" value={words} onChange={setWords} />
        <FilterMenu filters={list} />
        <IssueDisplayMenu value={display} onChange={setDisplay} />
      </>}
      below={isMobile ? <FilterChips filters={list} /> : <FilterBar filters={list} />}
      create={{ label: '이슈 추가', onClick: onCreate }}>
      {content()}
    </Page>
  </PeekLayout>;
}

/** 표시: 보기(리스트 · 보드), 정렬 기준, 기준에 맞는 말로 쓴 방향, 그룹(보드는 상태로 이미 나뉘어 그룹이 없다). */
function IssueDisplayMenu({ value, onChange }: { value: Display; onChange: (value: Display) => void }) {
  const isTweaked = (Object.keys(initialDisplay) as (keyof Display)[]).some(key => value[key] !== initialDisplay[key]);
  const [desc, asc] = directions[sorts.find(sort => sort.value === value.sort)?.kind ?? 'date'];
  return <DisplayMenu isTweaked={isTweaked} onReset={() => onChange(initialDisplay)}>
    <DisplayChoice title="보기" items={layouts} value={value.layout} onChange={layout => onChange({ ...value, layout })} />
    <DisplayChoice title="정렬 기준" items={sorts} value={value.sort} onChange={sort => onChange({ ...value, sort })} />
    <DisplayChoice title="방향" items={[{ value: 'desc', label: desc }, { value: 'asc', label: asc }] as const} value={value.direction}
      onChange={direction => onChange({ ...value, direction })} />
    {value.layout === 'board' ? null : <DisplayChoice title="그룹" items={groups} value={value.group} onChange={group => onChange({ ...value, group })} />}
  </DisplayMenu>;
}

/** 그룹: 접을 수 있는 머리(스크롤에 붙는다)와 그 줄들. 접기는 화면 상태라 주소에 두지 않는다. 그룹이 없으면 줄만. */
function Group({ label, icon, count, isGrouped, children }: { label: string; icon: ReactNode; count: number; isGrouped: boolean; children: ReactNode }) {
  const [isOpen, setOpen] = useState(true);
  if (!isGrouped) return children;
  return <section aria-label={label} className="flex flex-col">
    <ListGroupHeader label={label} icon={icon} count={count} isOpen={isOpen} onToggle={() => setOpen(!isOpen)} />
    {isOpen ? children : null}
  </section>;
}


function ListSkeleton() {
  return <div aria-busy="true" aria-label="이슈를 불러오는 중" className="flex flex-col">
    {Array.from({ length: 8 }, (_, index) => <div key={index} className="flex h-12 items-center gap-3 border-b bg-background px-4">
      <Skeleton className="size-4" /><Skeleton className="h-4 w-14" /><Skeleton className="h-4 flex-1" /><Skeleton className="h-4 w-32 max-md:hidden" />
    </div>)}
  </div>;
}

