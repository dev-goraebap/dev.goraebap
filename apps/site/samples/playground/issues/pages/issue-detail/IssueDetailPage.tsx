import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { ActionMenu } from '@/shared/ui/action-menu';
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert';
import { Button, buttonVariants } from '@/shared/ui/button';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { RichBody } from '@/shared/ui/editor';
import { CalendarIcon, ChartNoAxesColumnIcon, LinkIcon, ListChecksIcon, PencilIcon, PlusIcon, SquareCheckIcon, TagIcon, TrashIcon, TriangleAlertIcon,
  UserIcon } from '@/shared/ui/icon';
import { InfoPill } from '@/shared/ui/info-pill';
import { Input } from '@/shared/ui/input';
import { Page } from '@/shared/ui/page';
import { PageState } from '@/shared/ui/page-state';
import { DatePill, OptionPill } from '@/shared/ui/property-pill';
import { ActivityFeed, DetailLayout, type ActivityItem } from '@/shared/ui/reading';
import { RowLink } from '@/shared/ui/row-link';
import { Spinner } from '@/shared/ui/spinner';
import { toast } from '@/shared/ui/toast';
import { fakePreview } from '@samples/composites/editor-fixtures';
import { absoluteText, dateText, dueText, issueKeys, issueQueries, me, NONE, useIssueApi, type Issue, type IssuePatch } from '../../entities/issue';
import { assigneeOptions, Person, priorityOptions, StatusMark, statusOptions } from '../../entities/issue/ui';

const crumbs = [{ label: '이슈', href: '/issues', icon: TagIcon }];
const typeOptions = [{ value: 'task', label: '작업' }, { value: 'bug', label: '버그' }, { value: 'improvement', label: '개선' }] as const;
const labelOptions = ['성능', '디자인', '접근성', '고객 요청'].map(label => ({ value: label, label }));

/** 페이지 · 미리보기의 읽는 중 자리. */
function Loading() {
  return <div className="flex flex-1 items-center justify-center py-16"><Spinner aria-label="이슈를 불러오는 중" className="size-6" /></div>;
}

/** 머리 줄 아래의 실패 한 줄. 화면의 값은 저장된 값 그대로다. */
function Failure({ title, description }: { title: string; description?: string }) {
  return <Alert variant="destructive" className="shrink-0 rounded-none border-x-0 border-t-0">
    <TriangleAlertIcon />
    <AlertTitle>{title}</AlertTitle>
    {description ? <AlertDescription>{description}</AlertDescription> : null}
  </Alert>;
}

/**
 * 이슈 상세: 직접 진입할 수 있는 자기 주소의 페이지. 속성은 알약 하나씩 바로 바꾸고(저장 뒤 다시 읽는다) 실패는 머리 아래 줄에
 * 알린다. 편집은 늘 수정 화면(…/edit)을 연다(제목과 본문만). 하위 이슈를 더하면 상위 이슈를 채운 같은 양식으로 간다.
 * 휴대폰은 전체 화면(하단 탭 없이 ← · 제목 · 메뉴).
 */
export function IssueDetailPage({ id, onEdit, onAddSub }: { id: string; onEdit: () => void; onAddSub: () => void }) {
  const api = useIssueApi();
  const client = useQueryClient();
  const navigate = useNavigate();
  const [isDeleting, setDeleting] = useState(false);
  const remove = useMutation({
    mutationFn: () => api.remove(id),
    onSuccess: async () => { await client.invalidateQueries({ queryKey: issueKeys.all }); void navigate({ href: '/issues' }); },
  });
  const query = useQuery(issueQueries.detail(api, id));
  const change = useMutation({
    mutationFn: (patch: IssuePatch) => api.update(id, patch),
    onSettled: () => client.invalidateQueries({ queryKey: issueKeys.all }),
  });
  if (query.isPending) return <Page crumbs={[...crumbs, { label: id }]} isFullScreen><Loading /></Page>;
  if (query.isError && !query.data) {
    const isMissing = (query.error as { status?: number }).status === 404;
    return <Page crumbs={[...crumbs, { label: isMissing ? '없는 이슈' : id }]} isFullScreen>
      <PageState kind={isMissing ? 'not-found' : 'error'} title={isMissing ? '이슈를 찾을 수 없습니다' : '이슈를 불러오지 못했습니다'}
        description={isMissing ? '지워졌거나 주소가 바뀌었을 수 있습니다.' : '잠시 후 다시 시도해 주세요.'}
        action={isMissing ? <Link to={'/issues' as string} className={buttonVariants({ variant: 'secondary', className: 'max-md:h-11' })}>이슈 목록으로</Link>
          : <Button variant="secondary" onClick={() => void query.refetch()}>다시 시도</Button>} />
    </Page>;
  }
  const issue = query.data;
  const copy = async () => {
    try { await navigator.clipboard.writeText(`${location.origin}/issues/${issue.id}`); toast.add({ title: '주소를 복사했습니다' }); }
    catch { toast.add({ title: '주소를 복사하지 못했습니다' }); }
  };
  return <Page crumbs={[...crumbs, ...(issue.parent ? [{ label: issue.parent, href: `/issues/${issue.parent}` }] : []), { label: issue.id }]} isFullScreen
    actions={<div className="flex shrink-0 items-center gap-1">
      <Button variant="ghost" className="max-md:h-11" onClick={onEdit}><PencilIcon data-icon="inline-start" />편집</Button>
      <ActionMenu label="이슈 메뉴" actions={[
        { label: '수정', icon: PencilIcon, onSelect: onEdit },
        { label: '링크 복사', icon: LinkIcon, onSelect: () => void copy() },
        ...(issue.author === me ? [{ label: '삭제', icon: TrashIcon, onSelect: () => setDeleting(true) }] : []),
      ]} />
    </div>}
    below={<>
      {change.isError ? <Failure title="속성을 바꾸지 못했습니다" description="화면의 값은 저장된 값입니다. 다시 골라 주세요." /> : null}
      {remove.isError ? <Failure title="삭제하지 못했습니다" /> : null}
    </>}>
    <IssueView issue={issue} onChange={patch => change.mutate(patch)} onAddSub={onAddSub} onNavigate={href => void navigate({ href })} />
    <ConfirmDialog open={isDeleting} onOpenChange={setDeleting} title="이슈를 삭제할까요?" description="하위 이슈는 남고 상위 연결만 해제됩니다."
      action={{ label: '삭제', isPending: remove.isPending, onAction: () => remove.mutate() }} />
  </Page>;
}

/**
 * 이슈의 본문과 속성, 하위 이슈, 활동. 상세 페이지와 미리보기 칸이 같은 부품을 쓴다(조회도 같은 queryOptions).
 * 폭은 DetailLayout이 컨테이너로 판단하므로 좁은 칸에서는 속성이 제목 아래 알약 줄로 온다.
 */
export function IssueView({ issue, onChange, onAddSub, onNavigate }: {
  issue: Issue; onChange: (patch: IssuePatch) => void; onAddSub?: () => void;
  /** 본문의 앱 안 링크(다른 이슈)를 누르면 새 탭 대신 그 화면으로 간다. */
  onNavigate?: (href: string) => void;
}) {
  const api = useIssueApi();
  const all = useQuery(issueQueries.all(api));
  // 상위 이슈로 고를 수 있는 것: 자기 자신과 자기 아래(하위의 하위까지)는 뺀다.
  const parents = (all.data ?? []).filter(other => {
    let parent: string | undefined = other.id;
    const seen = new Set<string>();
    while (parent && !seen.has(parent)) {
      if (parent === issue.id) return false;
      seen.add(parent);
      parent = all.data?.find(each => each.id === parent)?.parent;
    }
    return true;
  });
  return <DetailLayout label={`${issue.id} ${issue.title}`} title={issue.title}
    head={<p className="flex items-center gap-2 text-sm text-muted-foreground tabular-nums">
      <span>{issue.id}</span>
      {issue.parent ? <span>· <Link to={`/issues/${issue.parent}` as string} className="font-medium text-foreground underline-offset-4 hover:underline">{issue.parent}</Link>의 하위 이슈</span> : null}
    </p>}
    sections={[
      { title: '속성', items: <>
        <OptionPill label="상태" icon={SquareCheckIcon} value={issue.status} options={statusOptions} onChange={status => onChange({ status })} />
        <OptionPill label="우선순위" icon={ChartNoAxesColumnIcon} value={issue.priority} options={priorityOptions} onChange={priority => onChange({ priority })} />
        <OptionPill label="담당자" emptyText="담당자 지정" icon={UserIcon} value={issue.assignee} options={assigneeOptions}
          onChange={name => onChange({ assignee: name === NONE ? undefined : name })} />
        <OptionPill label="유형" icon={ListChecksIcon} showLabel value={issue.type ?? 'task'} options={[...typeOptions]} onChange={type => onChange({ type })} />
        <DatePill label="시작일" value={issue.start} format={day => `시작일 ${absoluteText(day)}`} onChange={start => onChange({ start })} />
        <DatePill label="마감일" value={issue.due} format={day => `마감일 ${dueText(day)}`} onChange={due => onChange({ due })} />
      </> },
      { title: '라벨', items: <OptionPill label="라벨" emptyText="라벨 더하기" icon={TagIcon} isMultiple value={issue.labels ?? []} options={labelOptions}
        onChange={labels => onChange({ labels })} /> },
      { title: '상위 이슈', items: <OptionPill label="상위 이슈" icon={LinkIcon} value={issue.parent ?? NONE}
        options={[{ value: NONE, label: '상위 이슈 없음' }, ...parents.map(other => ({ value: other.id, label: `${other.id} ${other.title}` }))]}
        onChange={parent => onChange({ parent: parent === NONE ? undefined : parent })} /> },
      { title: '정보', items: <InfoPill label="수정일" icon={<CalendarIcon />}>{dateText(issue.updatedAt)}</InfoPill> },
    ]}
    after={<>
      <SubIssues parent={issue.id} onAdd={onAddSub} />
      <Comments issue={issue} />
    </>}>
    <RichBody value={issue.body} readPreview={fakePreview} onNavigate={onNavigate} />
  </DetailLayout>;
}

/** 하위 이슈: 상위 이슈 아래에 이어지는 작업. 끝난 수 / 전체, 줄 목록, 제목만 적어 바로 더하는 칸과 양식으로 더하기. */
function SubIssues({ parent, onAdd }: { parent: string; onAdd?: () => void }) {
  const api = useIssueApi();
  const client = useQueryClient();
  const [title, setTitle] = useState('');
  const create = useMutation({
    mutationFn: () => api.create({ title: title.trim(), body: { type: 'doc' }, status: 'todo', priority: 'medium', parent }),
    onSuccess: async () => { setTitle(''); await client.invalidateQueries({ queryKey: issueKeys.all }); },
  });
  const query = useQuery(issueQueries.all(api));
  const children = (query.data ?? []).filter(each => each.parent === parent).sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }));
  const done = children.filter(each => each.status === 'done').length;
  return <section aria-label="하위 이슈" className="flex flex-col gap-2 pt-5">
    <div className="flex items-center justify-between gap-2">
      <h2 className="text-xs font-medium text-muted-foreground tabular-nums">하위 이슈{children.length ? ` ${done}/${children.length}` : ''}</h2>
      {onAdd ? <Button variant="ghost" size="sm" className="max-md:h-11" onClick={onAdd}><PlusIcon data-icon="inline-start" />하위 이슈 추가</Button> : null}
    </div>
    {query.isPending ? <Spinner aria-label="하위 이슈를 불러오는 중" /> : null}
    {children.length ? <ul aria-label="하위 이슈 목록" className="flex flex-col overflow-hidden rounded-lg border">
      {children.map(child => <li key={child.id} className="relative flex items-center gap-2 border-b bg-background px-3 py-2 text-sm last:border-b-0 hover:bg-row-hover max-md:min-h-12">
        <StatusMark status={child.status} isCompact />
        <span className="text-xs text-muted-foreground tabular-nums">{child.id}</span>
        <RowLink to={`/issues/${child.id}` as string} className="min-w-0 flex-1 truncate">{child.title}</RowLink>
        <Person name={child.assignee} isCompact />
      </li>)}
    </ul> : null}
    {onAdd ? <div className="flex flex-col gap-1">
      <div className="relative">
        <Input aria-label="하위 이슈 추가" placeholder="하위 이슈 제목을 적고 Enter" value={title} onChange={event => setTitle(event.target.value)}
          aria-invalid={create.isError || undefined} aria-busy={create.isPending || undefined} className="pr-9"
          onKeyDown={event => {
            if (event.key !== 'Enter' || event.nativeEvent.isComposing) return;
            event.preventDefault();
            if (title.trim() && !create.isPending) create.mutate();
          }} />
        {create.isPending ? <Spinner className="absolute top-1/2 right-3 -translate-y-1/2" /> : null}
      </div>
      {create.isError ? <p role="alert" className="text-sm text-destructive">추가하지 못했습니다.</p> : null}
    </div> : null}
  </section>;
}

/** 활동: 만든 일 · 속성 변경 · 댓글을 시간순으로. 내 댓글은 고치고 지운다. 저장에 실패하면 입력은 남기고 아래에 알린다. */
function Comments({ issue }: { issue: Issue }) {
  const api = useIssueApi();
  const client = useQueryClient();
  const [error, setError] = useState<string>();
  const run = (work: Promise<unknown>) => work.then(async result => {
    setError(undefined);
    await client.invalidateQueries({ queryKey: issueKeys.all });
    return result;
  }, failure => {
    setError('저장하지 못했습니다. 입력은 그대로 남아 있습니다.');
    throw failure;
  });
  const items: ActivityItem[] = [
    { id: 'created', kind: 'event' as const, at: issue.createdAt, actorId: issue.author, actorName: issue.author, text: '이슈를 만들었습니다.', icon: PlusIcon },
    ...issue.comments.map(each => ({ id: each.id, kind: 'comment' as const, at: each.at, actorId: each.author, actorName: each.author, body: each.text,
      quote: each.quote, parentId: each.parentId, editedAt: each.editedAt })),
    ...(issue.events ?? []).map(event => ({ id: event.id, kind: 'event' as const, at: event.at, actorId: event.actor, actorName: event.actor, text: event.text, icon: PencilIcon })),
  ].sort((a, b) => a.at.localeCompare(b.at));
  return <>
    <ActivityFeed items={items} meId={me}
      onComment={(text, parentId) => run(api.comment(issue.id, text, parentId))}
      onEdit={(commentId, text) => run(api.editComment(issue.id, commentId, text))}
      onDelete={commentId => run(api.editComment(issue.id, commentId))} />
    {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
  </>;
}

/** 미리보기 칸의 내용: 같은 조회, 같은 본문. 대기 · 없음 · 실패는 칸 안의 작은 상태로 보이고 목록은 그대로 둔다. */
export function IssuePeek({ id }: { id: string }) {
  const api = useIssueApi();
  const client = useQueryClient();
  const query = useQuery(issueQueries.detail(api, id));
  const change = useMutation({
    mutationFn: (patch: IssuePatch) => api.update(id, patch),
    onSettled: () => client.invalidateQueries({ queryKey: issueKeys.all }),
  });
  if (query.isPending) return <Loading />;
  if (query.isError && !query.data) {
    const isMissing = (query.error as { status?: number }).status === 404;
    return <PageState isCompact kind={isMissing ? 'not-found' : 'error'} title={isMissing ? '이슈를 찾을 수 없습니다' : '이슈를 불러오지 못했습니다'}
      action={isMissing ? undefined : <Button variant="secondary" onClick={() => void query.refetch()}>다시 시도</Button>} />;
  }
  return <>
    {change.isError ? <Failure title="속성을 바꾸지 못했습니다" /> : null}
    <IssueView issue={query.data} onChange={patch => change.mutate(patch)} />
  </>;
}
