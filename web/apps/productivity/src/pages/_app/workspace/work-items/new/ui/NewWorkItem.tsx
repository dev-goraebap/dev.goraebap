import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Suspense, useId, useRef, useState } from 'react';
import {
  PRIORITIES, formatWorkItemDate, useWorkItemTypes, WorkItemLabelDot, WorkItemPriorityIcon, WorkItemStatusIcon, WorkItemTypeIcon, columnsOptions,
  createWorkItem, labelsOptions, refreshWorkItems, workItemPath, workingPeopleOptions, type WorkItemDraft, type WorkItemPriority, type WorkItemType,
} from '@/entities/work-item';
import { projectOptions, projectsOptions } from '@/entities/project';
import { sessionOptions } from '@/shared/auth';
import { useComposeExpansion, useComposeTransfer } from '@/shared/lib/panel';
import type { JSONNode } from '@/shared/lib/rich-document';
import { ComposeSurface, PlaceChip } from '@/shared/ui/kit/compose';
import { ChartNoAxesColumnIcon, ListChecksIcon, NotesIcon, ProjectsIcon, TagIcon, UserIcon, type Icon } from '@/shared/ui/kit/icon';
import type { Crumb } from '@/shared/ui/kit/layout/page';
import { PersonAvatar } from '@/shared/ui/person';
import { DatePill, OptionPill } from '@/shared/ui/kit/property-pill';
import { RichDraft, serverBodyStore, useDraftFiles } from '@/shared/ui/rich-body';
import type { DraftFilesSnapshot } from '@/shared/ui/rich-body/use-draft-files';
import { Spinner } from '@goraebap/ui-react/components/spinner';

const blankDraft = (columnId?: string): WorkItemDraft => ({ title: '', type: 'TASK', priority: 'MEDIUM', columnId, labelIds: [] });
type Snapshot = { chosenKey?: string; draft: WorkItemDraft; body?: JSONNode; files: DraftFilesSnapshot; created: { key: string; number: number } | null };

/**
 * 새 업무 (BIT's new work item, Linear's new issue): the title and the body on the paper, then 유형 · 상태 · 우선순위 ·
 * 담당자 · 라벨 · 기한 as pills, in a dialog over the list it was opened from or on its own page (ComposeSurface). The
 * project is fixed when it is opened from one (its chip), else a pill asks for it. The status starts at the project's
 * first 할 일 column unless one is given (a board's column, a status group's +). The body is written to the new work
 * item's body right after it is made. onCreated opens the item once it is saved.
 * crumbs는 키트 Page의 경로다(아이콘이 컴포넌트). 라우터가 주는 이름 아이콘(글자)은 그릴 수 없어 빼고 그리므로, 아이콘을 보이려면
 * 부르는 쪽이 pageCrumbs(@/shared/ui/nav-icon)로 바꿔 넘긴다.
 */
export function NewWorkItem({ projectKey, columnId, surface, crumbs, onClose, onExpand, onCreated }: {
  projectKey?: string; columnId?: string; surface: 'dialog' | 'page'; crumbs: readonly (Omit<Crumb, 'icon'> & { icon?: Icon | string })[];
  onClose: () => void; onExpand?: () => void; onCreated: (created: { key: string; number: number }) => void;
}) {
  const client = useQueryClient();
  const me = useQuery(sessionOptions()).data;
  const projects = useQuery({ ...projectsOptions('ACTIVE'), enabled: !projectKey });
  const fixedProject = useQuery({ ...projectOptions(projectKey ?? ''), enabled: !!projectKey });
  const transfer = useComposeTransfer<Snapshot>(`new-work-item:${projectKey ?? ''}:${columnId ?? ''}`);
  const initial = transfer.initial;
  const [chosenKey, setChosenKey] = useState<string | undefined>(initial?.chosenKey);
  const key = projectKey ?? chosenKey ?? '';
  const columns = useQuery({ ...columnsOptions(key), enabled: !!key });
  const labels = useQuery({ ...labelsOptions(), enabled: !!key });
  const { types } = useWorkItemTypes();
  const people = useQuery(workingPeopleOptions());
  const [draft, setDraft] = useState(() => initial?.draft ?? blankDraft(columnId));
  const [body, setBody] = useState<JSONNode | undefined>(initial?.body);
  const files = useDraftFiles(initial?.files);
  const [hasPendingUpload, setPendingUpload] = useState(false);
  const createdRef = useRef<{ key: string; number: number } | null>(initial?.created ?? null);
  const draftId = useId();
  const set = (patch: Partial<WorkItemDraft>) => setDraft(current => ({ ...current, ...patch }));
  const create = useMutation({
    mutationFn: async () => {
      const created = createdRef.current ?? await createWorkItem(key, draft);
      createdRef.current = created;
      if (body) {
        const store = serverBodyStore({ base: `${workItemPath(created.key, created.number)}/body`, author: me?.name ?? '', canWrite: true });
        const now = await store.load();
        await store.save({ expectedVersion: now.version, ...files.prepare(body, now.files), checkpoint: false });
      }
      createdRef.current = null;
      return created;
    },
    onSuccess: created => { transfer.clear(); onCreated(created); },
    onSettled: () => refreshWorkItems(client),
  });
  const firstToDo = columns.data?.find(column => column.category === 'UNSTARTED') ?? columns.data?.[0];
  const isDated = !draft.startDate || !draft.dueDate || draft.startDate <= draft.dueDate;
  const isReady = !!key && draft.title.trim().length > 0 && isDated && !hasPendingUpload;
  // 업무는 만들었는데 본문 저장이 실패했으면 속성을 더 바꾸지 않고 본문 저장만 다시 한다.
  const isLocked = create.isPending || !!createdRef.current;
  const keep = () => { transfer.keep({ chosenKey, draft, body, files: files.handoff(), created: createdRef.current }); };
  useComposeExpansion(surface, keep);
  const expand = onExpand && !hasPendingUpload && !create.isPending ? () => { keep(); onExpand(); } : undefined;
  const close = () => { transfer.clear(); onClose(); };
  // 고르는 동안 속성을 잠글 수 없는 키트 알약 대신, 잠긴 동안은 알약 줄을 통째로 막는다(inert).
  const pills = <div className="contents" inert={isLocked || undefined}>
    {projectKey ? null : <OptionPill label="프로젝트" icon={ProjectsIcon} isRequired value={chosenKey}
      onChange={next => { setChosenKey(next); set({ columnId: undefined, labelIds: [] }); }}
      options={(projects.data ?? []).map(project => ({ value: project.key, label: project.name, icon: <ProjectsIcon /> }))} />}
    <OptionPill label="유형" icon={NotesIcon} value={draft.type} onChange={type => set({ type: type as WorkItemType })}
      options={types.map(type => ({ value: type.code, label: type.name, icon: <WorkItemTypeIcon type={type.code} /> }))} />
    <OptionPill label="상태" icon={ListChecksIcon} value={draft.columnId ?? firstToDo?.id} onChange={id => set({ columnId: id })}
      options={(columns.data ?? []).map(column => ({ value: column.id, label: column.name, icon: <WorkItemStatusIcon category={column.category} /> }))} />
    <OptionPill label="우선순위" icon={ChartNoAxesColumnIcon} value={draft.priority === 'NONE' ? undefined : draft.priority}
      onChange={priority => set({ priority: priority as WorkItemPriority })}
      options={PRIORITIES.map(priority => ({ value: priority.value, label: priority.label, icon: <WorkItemPriorityIcon priority={priority.value} /> }))} />
    <OptionPill label="담당자" icon={UserIcon} value={draft.assigneeId} onChange={assigneeId => set({ assigneeId })}
      options={(people.data ?? []).map(person => ({
        value: person.id, label: person.id === me?.id ? `${person.name} (나)` : person.name,
        icon: <PersonAvatar id={person.id} name={person.name} size={16} isStatic />,
      }))} />
    {(labels.data?.length ?? 0) > 0 ? <OptionPill label="라벨" icon={TagIcon} isMultiple value={draft.labelIds} onChange={labelIds => set({ labelIds })}
      options={(labels.data ?? []).map(label => ({ value: label.id, label: label.name, icon: <WorkItemLabelDot color={label.color} /> }))} /> : null}
    <DatePill label="기한" value={draft.dueDate} format={formatWorkItemDate} onChange={dueDate => set({ dueDate })} />
  </div>;
  return <ComposeSurface surface={surface} crumbs={crumbs.map(({ icon, ...crumb }) => ({ ...crumb, icon: typeof icon === 'string' ? undefined : icon }))}
    chip={projectKey ? <PlaceChip icon={<ProjectsIcon />} label={fixedProject.data?.name ?? projectKey} /> : undefined}
    onClose={close} onExpand={expand} error={create.error?.message} pills={pills}
    submit={{ label: createdRef.current ? '본문 저장 재시도' : '만들기', isDisabled: !isReady, isPending: create.isPending, onSubmit: () => create.mutate() }}>
    {/* 제목과 본문은 종이 위에 테두리 없이 쓴다. 크기는 놓인 곳(대화상자 · 페이지)이 정한다(group/compose). */}
    <input aria-label="제목" placeholder="업무 제목" autoFocus autoComplete="off" readOnly={isLocked} value={draft.title}
      onChange={event => set({ title: event.target.value.slice(0, 200) })}
      className="w-full bg-transparent text-lg leading-snug font-semibold outline-none placeholder:text-muted-foreground/70 group-data-page/compose:text-2xl" />
    <div className="min-h-14 min-w-0 group-data-page/compose:min-h-48">
      <Suspense fallback={<Spinner aria-label="편집기를 불러오는 중" />}>
        <RichDraft id={`new-work-item-${draftId}`} value={body} upload={files.upload} onUploadPendingChange={setPendingUpload} onChange={setBody}
          placeholder="설명을 덧붙이세요… ( / 로 블록)" />
      </Suspense>
    </div>
  </ComposeSurface>;
}
