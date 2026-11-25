import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { boardGroupsOptions, CATEGORIES, workspaceWorkItemHref, type WorkItemBoardGroup, newWorkItemHref } from '@/entities/work-item';
import { useOpenPanel } from '@/shared/lib/panel';
import { Button } from '@goraebap/ui-react/compact/button';
import { Page } from '@/shared/ui/kit/layout/page';
import { PageState } from '@/shared/ui/kit/page-state';
import { pageCrumbs } from '@/shared/ui/nav-icon';
import { PagedWorkItemGroups } from '@/features/work-item-list';

type Crumb = { label: string; href?: string; icon?: string };
type Category = (typeof CATEGORIES)[number]['value'];

/** 위의 알약으로 고르는 열린 묶음, 손대고 있는 것부터. */
const OPEN: readonly Category[] = ['STARTED', 'UNSTARTED', 'BACKLOG'];
const MINE = { assignee: 'me', sort: 'UPDATED', direction: 'DESC' } as const;

const markOf = (category: Category) => CATEGORIES.find(each => each.value === category)!;
const totalOf = (groups: WorkItemBoardGroup[] | undefined, category: Category) =>
  (groups ?? []).filter(group => group.category === category).reduce((sum, group) => sum + group.total, 0);
const isClosed = (group: WorkItemBoardGroup) => group.category === 'COMPLETED' || group.category === 'CANCELED';

/**
 * 맨 위의 묶음 고르기: 분류마다 내가 맡은 열린 업무의 수가 적힌 알약. 누르면 그 묶음만 보이고, 고른 것을 다시 누르면 모두
 * 보인다(진행 중 · 할 일 · 백로그를 오간다).
 */
function Summary({ groups, only, onPick }: { groups: WorkItemBoardGroup[] | undefined; only: Category | null; onPick: (category: Category | null) => void }) {
  return (
    <div role="group" aria-label="묶음 고르기" className="flex shrink-0 gap-2 overflow-x-auto border-b px-4 py-3 [scrollbar-width:none]">
      {OPEN.map(category => {
        const mark = markOf(category);
        const isOn = only === category;
        return (
          <Button key={category} variant={isOn ? 'view-active' : 'view'} size="sm" aria-pressed={isOn} className="shrink-0 rounded-full max-md:h-8"
            onClick={() => onPick(isOn ? null : category)}>
            <mark.icon data-icon="inline-start" className={mark.tone} />
            {mark.label}
            <span className="font-semibold tabular-nums">{totalOf(groups, category)}</span>
          </Button>
        );
      })}
    </div>
  );
}

/**
 * 내 업무(/my-work): 어느 프로젝트의 것이든 내가 담당한 업무만 본다. 목록은 업무 목록과 같은 부품(상태 묶음 · 접기 · 하위
 * 업무 · 더 보기 · 빈 화면)이고, 조건만 담당자가 나로 고정된다. 끝난 묶음(완료 · 취소)은 접어 둔다. 위의 알약으로 열린 한
 * 묶음만 골라 본다. 업무는 프로젝트 아래 주소 하나로 연다(데스크톱은 이 목록 위 대화상자).
 */
export function MyWorkPage({ crumbs }: { crumbs: Crumb[] }) {
  const openPanel = useOpenPanel();
  const [only, setOnly] = useState<Category | null>(null);
  const all = useQuery(boardGroupsOptions(undefined, MINE, 'STATUS'));
  const create = { label: '새 업무', onClick: () => openPanel(newWorkItemHref()) };
  return (
    <Page crumbs={pageCrumbs(crumbs)} create={create}>
      {all.error ? <PageState kind="error" title="내 업무를 불러오지 못했습니다" description={all.error.message} /> : <>
        {all.data?.length ? <Summary groups={all.data} only={only} onPick={setOnly} /> : null}
        <PagedWorkItemGroups listing={only ? { ...MINE, category: only } : MINE} grouping="STATUS" showsProject hrefOf={workspaceWorkItemHref}
          isNarrowed={!!only} onClear={() => setOnly(null)} isFolded={isClosed} create={create} empty={{ title: '담당한 업무가 없습니다' }} />
      </>}
    </Page>
  );
}
