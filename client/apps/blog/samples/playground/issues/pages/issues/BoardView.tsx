import { statuses, type Issue } from '../../entities/issue';
import { IssueCard, StatusIcon } from '../../entities/issue/ui';

/**
 * 보드: 상태마다 한 칸. 칸 머리는 상태와 개수, 카드는 칸 안에서 현재 정렬 순서를 따른다. 보드 안에서만 가로로 넘기고 키보드는
 * 보드 영역으로 초점을 받아 방향키로 넘긴다. 이슈가 없는 칸도 그대로 두어 어느 상태에 몇 건인지 한눈에 보이게 한다.
 * 휴대폰(64rem 미만)은 칸을 화면의 85% 폭으로 두고 칸마다 멈춘다.
 */
export function BoardView({ items }: { items: Issue[] }) {
  return <div role="region" aria-label="상태별 보드" tabIndex={0}
    className="flex min-h-0 min-w-0 flex-1 snap-x snap-mandatory gap-3 overflow-x-auto p-4 outline-none scroll-px-4 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset md:snap-none">
    {statuses.map(status => {
      const cards = items.filter(item => item.status === status.id);
      return <section key={status.id} aria-label={status.label}
        className="flex w-[85%] shrink-0 snap-start flex-col self-start rounded-xl bg-band md:w-auto md:min-w-60 md:flex-1">
        <header className="flex h-11 shrink-0 items-center gap-2 px-3 text-sm font-medium md:h-10">
          <StatusIcon status={status.id} />
          <span className="truncate">{status.label}</span>
          <span className="ml-auto font-normal text-muted-foreground tabular-nums">{cards.length}</span>
        </header>
        {cards.length
          ? <ul className="flex flex-col gap-2 px-2 pb-2">{cards.map(issue => <IssueCard key={issue.id} issue={issue} />)}</ul>
          : <p className="px-2 pt-2 pb-6 text-center text-sm text-muted-foreground">이슈가 없습니다</p>}
      </section>;
    })}
  </div>;
}
