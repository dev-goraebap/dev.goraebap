import { Link } from '@tanstack/react-router';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { CalendarIcon, CircleCheckIcon, ClockIcon, EyeIcon, RefreshCwIcon, SirenIcon, type Icon } from '@/shared/ui/icon';
import { PersonAvatar } from '@/shared/ui/person-avatar';
import { RowLink } from '@/shared/ui/row-link';
import { dateText, dueText, isOverdue, NONE, people, priorities, priorityOf, statusOf, statuses, type Issue, type IssuePriority, type IssueStatus } from './model';

/*
 * 링크 주소의 `as string`: 견본은 자기 메모리 라우터를 쓰는데 Link의 to 타입은 사이트에 등록된 경로만 받는다. 글자로 넘겨 그 검사를 피한다.
 */

/** 상태의 표식: 원 모양 아이콘 한 가족과 표식 색 토큰(--mark-*). 할 일은 색 없이 보조 아이콘 색. */
const statusMarks: Record<IssueStatus, { icon: Icon; tone: string }> = {
  todo: { icon: ClockIcon, tone: 'text-icon-muted' },
  doing: { icon: RefreshCwIcon, tone: 'text-mark-progress' },
  review: { icon: EyeIcon, tone: 'text-mark-medium' },
  done: { icon: CircleCheckIcon, tone: 'text-mark-done' },
};
const priorityTone: Record<IssuePriority, string> = { urgent: 'text-mark-urgent', high: 'text-mark-high', medium: 'text-mark-medium', low: 'text-mark-low' };

/** 상태 아이콘. 이름을 옆에 쓰는 자리(알약 · 고르기)에서는 장식이고, 아이콘만 둘 때는 상태 이름으로 읽힌다. */
export function StatusIcon({ status, isLabelled = false, className }: { status: IssueStatus; isLabelled?: boolean; className?: string }) {
  const mark = statusMarks[status];
  return <mark.icon role={isLabelled ? 'img' : undefined} aria-hidden={!isLabelled} aria-label={isLabelled ? statusOf(status).label : undefined}
    className={cn('shrink-0', mark.tone, className)} />;
}

/** 상태: 아이콘과 이름. isCompact는 아이콘만(이름은 접근 가능한 이름으로 남는다). */
export function StatusMark({ status, isCompact = false }: { status: IssueStatus; isCompact?: boolean }) {
  if (isCompact) return <StatusIcon status={status} isLabelled />;
  return <span className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
    <StatusIcon status={status} />
    <span className="truncate whitespace-nowrap">{statusOf(status).label}</span>
  </span>;
}

/** 우선순위: 막대 세 칸 중 채운 단계(긴급은 사이렌). 이름은 접근 가능한 이름과 title로 남긴다. */
export function PriorityMark({ priority, isDecorative = false }: { priority: IssuePriority; isDecorative?: boolean }) {
  const { label, rank } = priorityOf(priority);
  const props = { role: isDecorative ? undefined : 'img', 'aria-hidden': isDecorative || undefined, 'aria-label': isDecorative ? undefined : `우선순위: ${label}`,
    className: cn('size-4 shrink-0', priorityTone[priority]) };
  if (priority === 'urgent') return <span title={label} className="flex"><SirenIcon {...props} /></span>;
  return <span title={label} className="flex">
    <svg viewBox="0 0 24 24" focusable="false" {...props}>
      {[7, 12, 18].map((height, index) => (
        <rect key={height} x={3 + index * 7} y={21 - height} width="4" height={height} rx="1" fill="currentColor" opacity={index < rank ? 1 : 0.24} />
      ))}
    </svg>
  </span>;
}

/** 마감일: 아이콘과 날짜. 지났고 끝나지 않았으면 붉게 하되 글자("N일 지남")로도 알린다. */
export function DueDate({ issue }: { issue: Pick<Issue, 'due' | 'status'> }) {
  if (!issue.due) return null;
  const overdue = isOverdue(issue);
  return <span className={cn('flex shrink-0 items-center gap-1 text-xs whitespace-nowrap tabular-nums', overdue ? 'text-destructive' : 'text-muted-foreground')}>
    <CalendarIcon role="img" aria-hidden={false} aria-label="마감일" className={cn('size-3.5 shrink-0', !overdue && 'text-icon-muted')} />
    {overdue ? dueText(issue.due) : dateText(issue.due)}
  </span>;
}

/** 담당자 없음: 점선 원 안의 사람 윤곽. 아바타와 같은 20px 자리. */
function Nobody() {
  return <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false" className="size-5 shrink-0 text-icon-muted">
    <circle cx="10" cy="10" r="9.25" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2" />
    <circle cx="10" cy="7.5" r="2.25" fill="none" stroke="currentColor" strokeWidth="1.25" />
    <path d="M5.5 14.5a4.75 4.75 0 0 1 9 0" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
  </svg>;
}

/**
 * 담당자: 사진과 이름. 지정 안 됨도 같은 자리에 같은 크기로 둔다. onPick이 있으면 누르면 그 사람으로 거른다
 * (줄 링크 위에 띄워 따로 눌린다).
 */
export function Person({ name, onPick, isCompact = false }: { name?: string; onPick?: (name: string) => void; isCompact?: boolean }) {
  if (!name) return <span role={isCompact ? 'img' : undefined} aria-label={isCompact ? '담당자 지정 안 됨' : undefined} title={isCompact ? '담당자 지정 안 됨' : undefined}
    className="flex min-w-0 shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
    <Nobody />{isCompact ? null : <span className="truncate">지정 안 됨</span>}
  </span>;
  const face = <><PersonAvatar name={name} />{isCompact ? null : <span className="truncate">{name}</span>}</>;
  if (!onPick) return <span title={isCompact ? name : undefined} className="flex min-w-0 shrink-0 items-center gap-1.5 text-xs">{face}</span>;
  return <button type="button" aria-label={`${name}의 이슈만 보기`} title={isCompact ? name : undefined} onClick={() => onPick(name)}
    className="relative z-1 flex max-w-24 min-w-0 shrink-0 items-center gap-1.5 rounded-full px-1 py-0.5 text-xs outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring max-md:min-h-11">
    {face}
  </button>;
}

/**
 * 목록 줄: 시작은 우선순위와 키, 제목(한 줄 말줄임). 끝은 늘 있는 값(상태 · 담당자)을 바깥쪽에, 가끔 있는 값(마감 · 미리보기)을 안쪽에.
 * 줄 전체가 상세로 가는 링크(RowLink)이고 담당자 · 미리보기는 그 위에 띄워 따로 누른다. 좁으면 상태는 아이콘만, 담당자는 사진만, 미리보기는 뺀다.
 */
export function IssueRow({ issue, isCompact, isPeeking = false, onPeek, onAssignee }: {
  issue: Issue; isCompact: boolean; isPeeking?: boolean; onPeek: (issue: Issue) => void; onAssignee: (name: string) => void;
}) {
  return <li data-peek-row={issue.id} aria-current={isPeeking || undefined}
    className="relative flex items-center gap-3 border-b bg-background px-4 py-3 text-sm hover:bg-row-hover aria-current:bg-muted max-md:min-h-13 compact:py-2">
    <span className="flex shrink-0 items-center gap-2">
      <PriorityMark priority={issue.priority} />
      <span className="min-w-13 text-xs text-muted-foreground tabular-nums">{issue.id}</span>
    </span>
    <RowLink to={`/issues/${issue.id}` as string} aria-label={`${issue.id} ${issue.title}`} className="min-w-0 flex-1 truncate font-medium">{issue.title}</RowLink>
    <span className="flex shrink-0 items-center gap-2.5">
      {isCompact ? null : <Button variant="ghost" size="icon-xs" aria-label={`${issue.id} 미리보기`} title="미리보기 (Space)" aria-pressed={isPeeking}
        className="relative z-1 aria-pressed:bg-muted" onClick={() => onPeek(issue)}>
        <EyeIcon chosen={isPeeking} />
      </Button>}
      {isCompact ? null : <DueDate issue={issue} />}
      <StatusMark status={issue.status} isCompact={isCompact} />
      <Person name={issue.assignee} onPick={onAssignee} isCompact={isCompact} />
    </span>
  </li>;
}

/** 보드 카드: 카드 전체가 하나의 링크라 안에 다른 버튼을 두지 않는다. 담당자는 사진만. 제목은 두 줄까지. */
export function IssueCard({ issue }: { issue: Issue }) {
  return <li data-peek-row={issue.id} className="list-none">
    <Link to={`/issues/${issue.id}` as string} aria-label={`${issue.id} ${issue.title}`}
      className="flex flex-col gap-2 rounded-lg border bg-card p-3 text-sm wrap-anywhere shadow-xs outline-none hover:bg-row-hover focus-visible:ring-2 focus-visible:ring-ring">
      <span className="flex items-center gap-2">
        <PriorityMark priority={issue.priority} />
        <span className="text-xs text-muted-foreground tabular-nums">{issue.id}</span>
      </span>
      <span className="line-clamp-2 font-medium">{issue.title}</span>
      <span className="flex items-center justify-between gap-2">
        <DueDate issue={issue} />
        <span className="ml-auto"><Person name={issue.assignee} isCompact /></span>
      </span>
    </Link>
  </li>;
}

/** 속성 알약의 선택지. 값 앞의 표식(아이콘 · 막대 · 사진)은 장식이라 이름만 읽힌다. */
export const statusOptions = statuses.map(each => ({ value: each.id, label: each.label, icon: <StatusIcon status={each.id} /> }));
export const priorityOptions = priorities.map(each => ({ value: each.id, label: each.label, icon: <PriorityMark priority={each.id} isDecorative /> }));
export const assigneeOptions = [
  ...people.map(name => ({ value: name, label: name, icon: <PersonAvatar name={name} className="size-4" /> })),
  { value: NONE, label: '지정 안 됨', icon: <Nobody /> },
];
