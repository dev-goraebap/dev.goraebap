import { Button } from '@astryxdesign/core/Button';
import { Center } from '@astryxdesign/core/Center';
import { Spinner } from '@astryxdesign/core/Spinner';
import type { JSONContent } from '@tiptap/react';
import { RichDraft } from '@kit/composites/editor/RichDraft';
import { DatePill, OptionPill, PropertyPill } from '@kit/composites/property/PropertyPill';
import { PageState } from '@kit/composites/state/PageState';
import { icon } from '@kit/foundations/icons/solar-icon';
import { Page } from '@kit/layouts/page/Page';
import { ComposeForm } from '@kit/patterns/compose/ComposeForm';
import { ComposeSurface, PlaceChip } from '@kit/patterns/compose/ComposeSurface';
import { useDraft } from '@kit/patterns/compose/draft-store';
import { focusFirstInvalid } from '@kit/patterns/compose/validation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { issueKeys, issueQueries, NONE, today, useIssueApi, type Issue, type NewIssue } from '../../entities/issue';
import { assigneeOptions, priorityOptions, statusOptions } from '../../entities/issue/ui';

type Draft = { title: string; body?: JSONContent; status: Issue['status']; priority?: Issue['priority']; assignee?: string; due?: string };
const empty: Draft = { title: '', status: 'todo' };

/** 새 이슈와 수정을 같은 양식으로 쓴다. 수정은 저장한 값을 읽은 뒤 연다. parent가 있으면 그 이슈의 하위 이슈로 만든다. */
export function IssueCompose({ id, parent, surface, onClose, onExpand, onDone }: {
  id?: string; parent?: string; surface: 'dialog' | 'page'; onClose: () => void; onExpand?: () => void; onDone: (id: string) => void;
}) {
  const api = useIssueApi();
  const query = useQuery({ ...issueQueries.detail(api, id ?? ''), enabled: !!id });
  const crumbs = [{ label: '이슈', href: '/issues', icon: 'tag' as const }, { label: id ? `${id} 수정` : '새 이슈' }];
  if (id && query.isPending) return surface === 'page'
    ? <Page crumbs={crumbs} isDetail><Center height="100%"><Spinner label="이슈를 불러오는 중" /></Center></Page> : null;
  if (id && query.isError) return <Page crumbs={crumbs} isDetail>
    <PageState kind="error" title="이슈를 불러오지 못했습니다" action={<Button label="다시 시도" variant="secondary" onClick={() => void query.refetch()} />} />
  </Page>;
  const initial: Draft = query.data
    ? { title: query.data.title, body: query.data.body, status: query.data.status, priority: query.data.priority, assignee: query.data.assignee, due: query.data.due }
    : empty;
  return <ComposeBody key={`${id ?? 'new'}-${parent ?? ''}`} id={id} parent={parent} initial={initial} crumbs={crumbs} surface={surface}
    onClose={onClose} onExpand={onExpand} onDone={onDone} />;
}

function ComposeBody({ id, parent, initial, crumbs, surface, onClose, onExpand, onDone }: {
  id?: string; parent?: string; initial: Draft; crumbs: { label: string; href?: string; icon?: 'tag' }[]; surface: 'dialog' | 'page';
  onClose: () => void; onExpand?: () => void; onDone: (id: string) => void;
}) {
  const api = useIssueApi();
  const client = useQueryClient();
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
  // 제출 버튼은 막지 않는다. 처음 누른 뒤부터 빠진 값을 곁에 알리고 첫 번째로 초점을 옮긴다.
  const [isTried, setTried] = useState(false);
  const lacks = { title: !draft.title.trim(), priority: !draft.priority };
  const submit = () => {
    if (lacks.title || !draft.priority) { setTried(true); focusFirstInvalid(); return; }
    save.mutate({ title: draft.title.trim(), body: draft.body ?? { type: 'doc' }, status: draft.status, priority: draft.priority,
      assignee: draft.assignee, due: draft.due, parent });
  };
  return <ComposeSurface surface={surface} crumbs={crumbs} isDirty={isDirty} chip={<PlaceChip mark={icon('tag')} label={parent ? `${parent}의 하위 이슈` : '이슈'} />}
    onClose={() => { clearDraft(); onClose(); }} onExpand={onExpand}
    error={save.isError ? '저장하지 못했습니다. 입력한 내용은 그대로 있습니다.' : undefined}
    submit={{ label: id ? '저장' : '추가하기', isPending: save.isPending, onSubmit: submit }}>
    <ComposeForm isPage={surface === 'page'} title={draft.title} onTitle={title => set({ title })} titlePlaceholder="이슈 제목"
      titleError={isTried && lacks.title ? '제목을 입력해 주세요.' : undefined}
      pillsError={isTried && lacks.priority ? '필수 속성을 정해 주세요: 우선순위' : undefined}
      body={<RichDraft value={draft.body} onChange={body => set({ body })} isPage={surface === 'page'} placeholder="무엇을 왜 해야 하는지 적어 보세요" />}
      pills={<>
        <OptionPill label="상태" icon="clock" value={draft.status} options={statusOptions} onChange={status => set({ status: status as Issue['status'] })} />
        <OptionPill label="우선순위" icon="alert" isRequired isInvalid={isTried && lacks.priority} value={draft.priority} options={priorityOptions}
          onChange={priority => set({ priority: priority as Issue['priority'] })} />
        <OptionPill label="담당자" icon="user" emptyText="담당자 지정" value={draft.assignee} options={assigneeOptions}
          onChange={name => set({ assignee: name === NONE ? undefined : name })} />
        <DatePill label="마감일" value={draft.due} today={today} onChange={due => set({ due })} />
        {parent ? <PropertyPill label="상위 이슈" icon={icon('link', true)} isEmpty={false} isDisabled text={parent} /> : null}
      </>} />
  </ComposeSurface>;
}
