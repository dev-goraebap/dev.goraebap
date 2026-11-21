import { useQuery } from '@tanstack/react-query';
import { cn } from 'cn';
import { codeLinksOptions, providerName, type CodeLink } from '@/entities/work-item';
import { Timeline, TimelineItem } from '@/shared/ui/activity';
import { Badge } from '@/shared/ui/kit/badge';
import { BranchIcon, CodeIcon, CommitIcon } from '@/shared/ui/kit/icon';
import { visibleCodeLinks } from '../model/visible-code-links';

const KIND = { branch: '브랜치', pull_request: 'PR', commit: '커밋' } as Record<string, string>;
/** PR 상태의 표식: 열림은 진행 색, 병합은 완료 색, 닫힘은 오류 색, 초안은 조용한 색. */
const STATE: Record<string, { label: string; className: string }> = {
  open: { label: '열림', className: 'bg-secondary text-mark-progress' }, draft: { label: '초안', className: 'bg-secondary text-muted-foreground' },
  merged: { label: '병합됨', className: 'bg-secondary text-mark-done' }, closed: { label: '닫힘', className: 'bg-secondary text-destructive' },
};
const when = new Intl.DateTimeFormat('ko-KR', { month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit' });

/**
 * What in the project's repositories a work item is tied to (저장소 연동, BIT's CodeLinkList): its pull or merge requests in
 * their state, its branches (one whose request is listed is left out) and the commits naming it, on the same rule and
 * in the same rhythm as its 활동, oldest first. Each line says what it is, who and when, and opens on the host. Nothing
 * while nothing is linked.
 */
export function CodeLinks({ projectKey, number }: { projectKey: string; number: number }) {
  const links = useQuery(codeLinksOptions(projectKey, number)).data ?? [];
  const shown = visibleCodeLinks(links);
  if (!shown.length) return null;
  return <section aria-label="연결된 코드" className="flex flex-col gap-3">
    <h2 className="text-xs font-medium text-muted-foreground">연결된 코드</h2>
    <Timeline label="연결된 코드">{shown.map(link => <Line key={link.id} link={link} />)}</Timeline>
  </section>;
}

function Line({ link }: { link: CodeLink }) {
  const state = STATE[link.state];
  const Mark = link.kind === 'pull_request' ? CodeIcon : link.kind === 'branch' ? BranchIcon : CommitIcon;
  const isBranch = link.kind === 'branch';
  return <TimelineItem mark={<Mark className="size-4 text-icon-muted" />}>
    {/* 한 줄(20px)에 무엇인지 · 제목 · 상태 · 누가 언제. 가리키면 줄보다 조금 넓게 칠한다. 휴대폰은 저장소 이름이 윗줄로 간다. */}
    <a href={link.url} target="_blank" rel="noreferrer noopener" title={`${providerName(link.provider)} · ${link.baseUrl}/${link.repository}에서 열기`}
      className="-mx-1.5 -my-0.5 flex min-h-5 min-w-0 items-center gap-2 rounded-md px-1.5 py-0.5 text-xs text-muted-foreground no-underline outline-none hover:bg-row-hover focus-visible:ring-2 focus-visible:ring-ring max-md:min-h-11 max-md:flex-wrap max-md:text-sm">
      <span className="max-w-40 min-w-0 shrink truncate max-md:max-w-full max-md:basis-full max-md:text-xs">{link.repository}</span>
      <span className="shrink-0">{KIND[link.kind] ?? link.kind}</span>
      {link.kind === 'commit' ? <code className="shrink-0 font-mono">{link.externalId.slice(0, 7)}</code>
        : link.kind === 'pull_request' ? <span className="shrink-0 tabular-nums">#{link.externalId}</span> : null}
      <span className={cn('min-w-0 flex-1 truncate text-foreground', isBranch ? 'font-mono' : 'font-medium')}>{isBranch ? link.externalId : link.title}</span>
      {/* 상태는 늘 다 보이고, 자리가 모자라면 제목이 줄어든다. */}
      {link.kind === 'pull_request' && state ? <Badge className={state.className}>{state.label}</Badge> : null}
      <time className="ms-auto shrink-0 whitespace-nowrap max-md:whitespace-normal" dateTime={link.updatedAt} title={new Date(link.updatedAt).toLocaleString('ko-KR')}>
        {link.author ? `${link.author} · ` : ''}{when.format(new Date(link.updatedAt))}
      </time>
    </a>
  </TimelineItem>;
}
