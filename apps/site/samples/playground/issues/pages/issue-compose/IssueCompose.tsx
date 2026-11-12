import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { JSONContent } from '@tiptap/react';
import { useState } from 'react';
import { useDraft } from '@/shared/lib/draft';
import { Button } from '@/shared/ui/button';
import { ComposeSurface, PlaceChip } from '@/shared/ui/compose';
import { ConfirmDialog } from '@/shared/ui/confirm-dialog';
import { RichDraft } from '@/shared/ui/editor';
import { ChartNoAxesColumnIcon, LinkIcon, SquareCheckIcon, TagIcon, UserIcon } from '@/shared/ui/icon';
import { InfoPill } from '@/shared/ui/info-pill';
import { Page, type Crumb } from '@/shared/ui/page';
import { PageState } from '@/shared/ui/page-state';
import { DatePill, OptionPill } from '@/shared/ui/property-pill';
import { Spinner } from '@/shared/ui/spinner';
import { dueText, issueKeys, issueQueries, NONE, useIssueApi, type Issue, type NewIssue } from '../../entities/issue';
import { assigneeOptions, priorityOptions, statusOptions } from '../../entities/issue/ui';

type Draft = { title: string; body?: JSONContent; status: Issue['status']; priority?: Issue['priority']; assignee?: string; due?: string };
const empty: Draft = { title: '', status: 'todo' };

/**
 * 빠진 칸으로 초점을 옮긴다: 제목 칸(aria-invalid)과 빠진 알약(data-pill-invalid) 중 화면 순서로 첫 번째.
 * 키트 속성 알약은 aria-invalid를 받지 않아 감싼 요소의 표시로 찾는다.
 */
const focusMissing = () => requestAnimationFrame(() => {
  document.querySelector<HTMLElement>('[role=dialog] [aria-invalid="true"], [role=dialog] [data-pill-invalid] [data-slot=property-pill], [data-slot=page] [aria-invalid="true"], [data-slot=page] [data-pill-invalid] [data-slot=property-pill]')?.focus();
});

/** 새 이슈와 수정을 같은 양식으로 쓴다. 수정은 저장한 값을 읽은 뒤 연다. parent가 있으면 그 이슈의 하위 이슈로 만든다. */
export function IssueCompose({ id, parent, surface, onClose, onExpand, onDone }: {
  id?: string; parent?: string; surface: 'dialog' | 'page'; onClose: () => void; onExpand?: () => void; onDone: (id: string) => void;
}) {
  const api = useIssueApi();
  const query = useQuery({ ...issueQueries.detail(api, id ?? ''), enabled: !!id });
  const crumbs: Crumb[] = [{ label: '이슈', href: '/issues', icon: TagIcon }, { label: id ? `${id} 수정` : '새 이슈' }];
  if (id && query.isPending) return surface === 'page'
    ? <Page crumbs={crumbs} isFullScreen><div className="flex flex-1 items-center justify-center"><Spinner aria-label="이슈를 불러오는 중" className="size-6" /></div></Page> : null;
  if (id && query.isError) return <Page crumbs={crumbs} isFullScreen>
    <PageState kind="error" title="이슈를 불러오지 못했습니다" action={<Button variant="secondary" onClick={() => void query.refetch()}>다시 시도</Button>} />
  </Page>;
  const initial: Draft = query.data
    ? { title: query.data.title, body: query.data.body, status: query.data.status, priority: query.data.priority, assignee: query.data.assignee, due: query.data.due }
    : empty;
  return <ComposeBody key={`${id ?? 'new'}-${parent ?? ''}`} id={id} parent={parent} initial={initial} crumbs={crumbs} surface={surface}
    onClose={onClose} onExpand={onExpand} onDone={onDone} />;
}

function ComposeBody({ id, parent, initial, crumbs, surface, onClose, onExpand, onDone }: {
  id?: string; parent?: string; initial: Draft; crumbs: Crumb[]; surface: 'dialog' | 'page';
  onClose: () => void; onExpand?: () => void; onDone: (id: string) => void;
}) {
  const api = useIssueApi();
  const client = useQueryClient();
  // 초안은 라우터 위의 DraftProvider에 산다: 크게 보기(대화상자 → 페이지)나 분기점을 넘어 다시 그려도 남는다.
  const [draft, setDraft, clearDraft] = useDraft<Draft>(`issue:${id ?? `new${parent ? `-${parent}` : ''}`}`, initial);
  const set = (patch: Partial<Draft>) => setDraft({ ...draft, ...patch });
  const save = useMutation({
    mutationFn: (input: NewIssue) => id ? api.update(id, input) : api.create(input),
    onSuccess: saved => {
      void client.invalidateQueries({ queryKey: issueKeys.all });
      clearDraft();
      onDone(saved.id);
    },
  });
  const isDirty = JSON.stringify(draft) !== JSON.stringify(initial);
  const [isLeaveAsked, setLeaveAsked] = useState(false);
  const leave = () => { clearDraft(); onClose(); };
  // 고친 것이 있으면 닫기(닫기 · Esc · 바깥 누르기 · 취소)가 먼저 묻는다. 키트 양식 틀은 묻지 않으므로 여기서 가로챈다.
  const close = () => (isDirty ? setLeaveAsked(true) : leave());
  // 제출 버튼은 막지 않는다. 처음 누른 뒤부터 빠진 값을 곁에 알리고 첫 번째로 초점을 옮긴다.
  const [isTried, setTried] = useState(false);
  const lacks = { title: !draft.title.trim(), priority: !draft.priority };
  const submit = () => {
    if (lacks.title || !draft.priority) { setTried(true); focusMissing(); return; }
    save.mutate({ title: draft.title.trim(), body: draft.body ?? { type: 'doc' }, status: draft.status, priority: draft.priority,
      assignee: draft.assignee, due: draft.due, parent });
  };
  const titleError = isTried && lacks.title ? '제목을 입력해 주세요.' : undefined;
  const isPriorityMissing = isTried && lacks.priority;
  const isPage = surface === 'page';
  return <>
    <ComposeSurface surface={surface} crumbs={crumbs} chip={<PlaceChip icon={<TagIcon />} label={parent ? `${parent}의 하위 이슈` : '이슈'} />}
      onClose={close} onExpand={onExpand}
      error={save.isError ? '저장하지 못했습니다. 입력한 내용은 그대로 있습니다.' : undefined}
      submit={{ label: id ? '저장' : '추가하기', isPending: save.isPending, onSubmit: submit }}
      pills={<>
        <OptionPill label="상태" icon={SquareCheckIcon} value={draft.status} options={statusOptions} onChange={status => set({ status })} />
        <span data-pill-invalid={isPriorityMissing || undefined} className="contents data-pill-invalid:[&_[data-slot=property-pill]]:ring-destructive">
          <OptionPill label="우선순위" emptyText="우선순위 (필수)" icon={ChartNoAxesColumnIcon} value={draft.priority} options={priorityOptions}
            onChange={priority => set({ priority })} />
        </span>
        <OptionPill label="담당자" emptyText="담당자 지정" icon={UserIcon} value={draft.assignee} options={assigneeOptions}
          onChange={name => set({ assignee: name === NONE ? undefined : name })} />
        <DatePill label="마감일" value={draft.due} format={day => `마감일 ${dueText(day)}`} onChange={due => set({ due })} />
        {parent ? <InfoPill label="상위 이슈" icon={<LinkIcon />}>{parent}</InfoPill> : null}
        {isPriorityMissing ? <p role="alert" className="basis-full text-sm text-destructive">필수 속성을 정해 주세요: 우선순위</p> : null}
      </>}>
      <div className="flex flex-col gap-1">
        <input aria-label="제목" placeholder="이슈 제목" autoFocus autoComplete="off" value={draft.title} onChange={event => set({ title: event.target.value })}
          aria-invalid={!!titleError || undefined} aria-describedby={titleError ? 'issue-title-error' : undefined}
          className="w-full bg-transparent text-lg leading-snug font-semibold outline-none placeholder:text-muted-foreground/70 aria-invalid:shadow-[0_2px_0_-1px_var(--destructive)] group-data-page/compose:text-2xl" />
        {titleError ? <p id="issue-title-error" className="text-sm text-destructive">{titleError}</p> : null}
      </div>
      <div className={isPage ? 'min-h-48' : 'min-h-14'}>
        <RichDraft value={draft.body} onChange={body => set({ body })} isPage={isPage} placeholder="무엇을 왜 해야 하는지 적어 보세요" />
      </div>
    </ComposeSurface>
    <ConfirmDialog open={isLeaveAsked} onOpenChange={setLeaveAsked} title="작성 중인 내용을 버릴까요?"
      description="닫으면 지금까지 쓴 제목 · 본문 · 속성이 사라집니다."
      action={{ label: '버리기', onAction: () => { setLeaveAsked(false); leave(); } }} />
  </>;
}
