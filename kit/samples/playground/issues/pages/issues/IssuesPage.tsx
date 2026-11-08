import { PageViews } from '@kit/layouts/page/PageToolbar';
import { Button } from '@astryxdesign/core/Button';
import { Center } from '@astryxdesign/core/Center';
import { Spinner } from '@astryxdesign/core/Spinner';
import { VStack } from '@astryxdesign/core/VStack';
import { DisplayMenu } from '@kit/composites/filter/DisplayMenu';
import { useFilters } from '@kit/composites/filter/use-filters';
import { ListGroupHeader } from '@kit/composites/list-group/ListGroupHeader';
import { SearchTool } from '@kit/composites/search/SearchTool';
import { PageState } from '@kit/composites/state/PageState';
import { icon } from '@kit/foundations/icons/solar-icon';
import { useIsPhone } from '@kit/foundations/media';
import { Page } from '@kit/layouts/page/Page';
import { PageList, PageMore } from '@kit/layouts/page/PageParts';
import { PeekPanel } from '@kit/layouts/peek/PeekPanel';
import { useAddressDisplay, useAddressFilters, useAddressWords } from '@kit/patterns/list/list-address';
import { usePeek } from '@kit/patterns/routing/peek';
import { useQuery } from '@tanstack/react-query';
import { useState, type KeyboardEvent, type ReactNode } from 'react';
import { issueQueries, me, priorities, statuses, useIssueApi } from '../../entities/issue';
import { IssueRow } from '../../entities/issue/ui';
import { IssuePeek } from '../issue-detail/IssueDetailPage';
import { BoardView } from './BoardView';
import { filters, groups, initialDisplay, layouts, sorts, visibleIssues } from './model';

const PAGE = 8;
const pageOf = (id: string) => `/issues/${id}`;

/**
 * 이슈 목록. 같은 조회 결과를 행 목록과 상태별 보드로 보인다(표시 메뉴의 보기, 주소가 가진다). 머리 줄: 경로·도구(검색·필터·표시)·
 * 만들기. 실제 필터가 있을 때만 적용 줄. 상태 순서: 대기 → 실패(다시 시도) → 조건이 있는 0건(조건 지우기) → 0건(이슈 추가).
 * 행 클릭은 상세 페이지, 미리보기는 행 끝 버튼과 Space(작업 목록).
 */
export function IssuesPage({ onCreate }: { onCreate: () => void }) {
  const api = useIssueApi();
  const isPhone = useIsPhone();
  const [words, setWords] = useAddressWords('q');
  const [state, setState] = useAddressFilters(filters);
  const [display, setDisplay] = useAddressDisplay(initialDisplay, { layouts: layouts.map(each => each.id), sorts: sorts.map(each => each.id), groups: groups.map(each => each.id) });
  const list = useFilters(filters, { state, onStateChange: setState });
  const [limit, setLimit] = useState(PAGE);
  const peek = usePeek(pageOf);
  const query = useQuery(issueQueries.all(api));
  const items = visibleIssues(query.data ?? [], words, state, display);
  const hasConditions = !!words.trim() || list.count > 0;
  const clearConditions = () => { setWords(''); list.clear(); };
  const isBoard = display.layout === 'board';
  const place = state.assignee?.length === 1 && state.assignee[0] === me ? '내 이슈' : '모든 이슈';
  const peeked = peek.id ? (query.data ?? []).find(item => item.id === peek.id) : undefined;
  const keys = (event: KeyboardEvent<HTMLElement>) => {
    const row = (event.target as HTMLElement).closest<HTMLElement>('[data-peek-row]');
    if (!row || !(event.target instanceof HTMLAnchorElement)) return;
    const id = row.dataset.peekRow!;
    if (event.key === ' ') { event.preventDefault(); if (peek.id === id) peek.close(); else peek.open(id); return; }
    if (isBoard || (event.key !== 'ArrowDown' && event.key !== 'ArrowUp')) return;
    const rowsShown = [...document.querySelectorAll<HTMLElement>('[data-peek-row]')];
    const next = rowsShown[rowsShown.indexOf(row) + (event.key === 'ArrowDown' ? 1 : -1)];
    if (!next) return;
    event.preventDefault();
    (next.matches('a[href]') ? next : next.querySelector<HTMLElement>('a[href]'))?.focus();
    if (peek.id) peek.move(next.dataset.peekRow!);
  };
  const content = (): ReactNode => {
    if (query.isPending) return <Center height="100%"><Spinner label="이슈를 불러오는 중" /></Center>;
    if (query.isError && !query.data) return <PageState kind="error" title="이슈를 불러오지 못했습니다" description="잠시 후 다시 시도해 주세요."
      action={<Button label="다시 시도" variant="secondary" onClick={() => void query.refetch()} />} />;
    if (items.length === 0 && hasConditions) return <PageState kind="search" title="조건에 맞는 이슈가 없습니다" description="검색어나 필터를 바꿔 보세요."
      action={<Button label="조건 지우기" variant="secondary" onClick={clearConditions} />} />;
    if (items.length === 0) return <PageState kind="empty" title="아직 이슈가 없습니다" description="해야 할 일을 이슈로 남겨 보세요."
      action={<Button label="이슈 추가" variant="secondary" icon={icon('plus')} onClick={onCreate} />} />;
    if (isBoard) return <div onKeyDown={keys}><BoardView items={items} /></div>;
    const sections = display.group === 'status' ? statuses.map(each => ({ id: each.id, label: each.label, rows: items.filter(item => item.status === each.id) }))
      : display.group === 'priority' ? priorities.map(each => ({ id: each.id, label: each.label, rows: items.filter(item => item.priority === each.id) }))
      : [{ id: 'all', label: '', rows: items }];
    const shown = sections.filter(section => section.rows.length > 0);
    let left = limit;
    return <VStack onKeyDown={keys}>
      {shown.map(section => {
        const rows = section.rows.slice(0, Math.max(left, 0));
        left -= rows.length;
        return <Group key={section.id} label={section.label} count={section.rows.length} isGrouped={display.group !== 'none'}>
          {rows.length ? <PageList hasDividers aria-label={section.label || '이슈'}>
            {rows.map(issue => <IssueRow key={issue.id} issue={issue} isCompact={isPhone} isPeeking={peek.id === issue.id}
              onPeek={target => peek.id ? peek.move(target.id) : peek.open(target.id)} onAssignee={name => setState({ ...state, assignee: [name] })} />)}
          </PageList> : null}
        </Group>;
      })}
      <PageMore shown={Math.min(limit, items.length)} total={items.length} unit="개" hasMore={limit < items.length} isLoading={false} onMore={() => setLimit(limit + PAGE)} />
    </VStack>;
  };
  return <Page crumbs={[{ label: '이슈', icon: 'tag' }]}
    views={<PageViews views={[{id:'all',label:'모든 이슈',icon:'tag'},{id:'mine',label:'내 이슈',icon:'user'}]} value={place === '내 이슈' ? 'mine' : 'all'} onChange={value=>setState({...state,assignee:value === 'mine' ? [me] : []})} />}
    tools={<>
      <SearchTool label="이슈 검색" placeholder="키와 제목에서 찾기" value={words} onChange={setWords} />
      {list.tools}
      <DisplayMenu layouts={layouts} sorts={sorts} groups={isBoard ? undefined : groups} value={display} initial={initialDisplay} onChange={setDisplay} />
    </>}
    applied={list.applied}
    create={{ label: '이슈 추가', onClick: onCreate }}
    aside={peek.id ? <PeekPanel id={peek.id} title={peeked ? `${peeked.id} ${peeked.title}` : '이슈'} pageHref={pageOf(peek.id)} onClose={peek.close}>
      <IssuePeek id={peek.id} />
    </PeekPanel> : undefined}>
    {content()}
  </Page>;
}

function Group({ label, count, isGrouped, children }: { label: string; count: number; isGrouped: boolean; children: ReactNode }) {
  const [isOpen, setOpen] = useState(true);
  if (!isGrouped) return children;
  return <section aria-label={label}>
    <ListGroupHeader label={label} count={count} isOpen={isOpen} onToggle={() => setOpen(!isOpen)} />
    {isOpen ? children : null}
  </section>;
}
