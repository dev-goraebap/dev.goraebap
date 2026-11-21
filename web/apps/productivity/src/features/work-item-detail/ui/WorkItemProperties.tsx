import { useNavigate } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import {
  BOARD_SIZE, PRIORITIES, formatWorkItemDate, useWorkItemTypes, columnsOptions, cyclesOptions, labelsOptions, workItemsOptions, workingPeopleOptions,
  WorkItemLabelDot, WorkItemPriorityIcon, WorkItemStatusIcon, WorkItemTypeIcon, type WorkItemDraft, type WorkItemPriority, type WorkItemType,
  type WorkItemView,
} from '@/entities/work-item';
import { sessionOptions } from '@/shared/auth';
import {
  BranchIcon, CalendarIcon, ChartNoAxesColumnIcon, ListChecksIcon, NotesIcon, ProjectsIcon, RepeatIcon, TagIcon, UserIcon, type Icon,
} from '@/shared/ui/kit/icon';
import { InfoPill } from '@/shared/ui/kit/info-pill';
import { PersonAvatar } from '@/shared/ui/person';
import { DatePill, OptionPill, pillVariants } from '@/shared/ui/kit/property-pill';
import type { DetailSection } from '@/shared/ui/kit/reading';
import { WorkItemEffort } from './WorkItemEffort';

type Choice = { value: string; label: string; icon?: ReactNode };

/**
 * 고를 수 없는 알약(읽기만 하는 구성원, 고를 것이 없는 사이클 · 라벨): 고른 값이 있으면 그 표식과 이름, 여럿이면 개수,
 * 없으면 속성의 표식과 빈 말. 키트 알약에는 막힌 상태가 없어 읽는 알약(InfoPill)으로 둔다.
 */
function ReadPill({ label, icon: EmptyIcon, options, chosen, emptyText, showLabel }: {
  label: string; icon: Icon; options: Choice[]; chosen: readonly string[]; emptyText?: string; showLabel?: boolean;
}) {
  const picked = options.filter(option => chosen.includes(option.value));
  const first = picked[0];
  const text = !first ? emptyText ?? label : picked.length === 1 ? first.label : `${label} ${picked.length}`;
  return <InfoPill label={label} icon={first?.icon ?? <EmptyIcon />}>{showLabel && first ? `${label}: ${text}` : text}</InfoPill>;
}

/**
 * The work item's properties as its detail's groups (DetailLayout, Linear's issue): 속성 (status, priority, type,
 * assignee, start and due day), 공수 (story points, estimate, time spent), 라벨 and 상위 업무, each a pill changed at once, read only when the member may not write.
 * The parent is another work item of the project that is not this one nor one under it.
 */
export function useWorkItemSections({ view, canEdit, onChange }: {
  view: WorkItemView; canEdit: boolean; onChange: (patch: Partial<WorkItemDraft>) => void;
}): DetailSection[] {
  const navigate = useNavigate();
  const workItem = view.issue;
  const key = workItem.projectKey;
  const me = useQuery(sessionOptions()).data;
  const columns = useQuery(columnsOptions(key));
  const labels = useQuery(labelsOptions());
  const cycles = useQuery(cyclesOptions(key));
  const { types } = useWorkItemTypes();
  const people = useQuery({ ...workingPeopleOptions(), enabled: canEdit });
  const workItems = useInfiniteQuery({ ...workItemsOptions(key, {}, BOARD_SIZE), enabled: canEdit });
  const below = new Set([workItem.id, ...view.children.map(child => child.id)]);
  const parents = (workItems.data?.pages.flatMap(page => page.items) ?? []).filter(other => !below.has(other.id) && other.parentId !== workItem.id);
  const parentOptions: Choice[] = [
    ...(view.parent && !parents.some(other => other.id === view.parent?.id) ? [{ value: view.parent.id, label: `${view.parent.ref} ${view.parent.title}` }] : []),
    ...parents.map(other => ({ value: other.id, label: `${other.ref} ${other.title}` })),
  ];
  const person = (id: string, name: string): Choice => ({
    value: id, label: id === me?.id ? `${name} (나)` : name,
    icon: <PersonAvatar id={id} name={name} size={16} isStatic />,
  });
  const everyone = (people.data ?? []).map(each => person(each.id, each.name));
  const assignees = workItem.assigneeId && !everyone.some(each => each.value === workItem.assigneeId)
    ? [person(workItem.assigneeId, workItem.assigneeName ?? '알 수 없는 사람'), ...everyone] : everyone;
  const statuses: Choice[] = (columns.data ?? [{ id: workItem.columnId, name: workItem.columnName, category: workItem.category }])
    .map(column => ({ value: column.id, label: column.name, icon: <WorkItemStatusIcon category={column.category} /> }));
  const priorities: Choice[] = PRIORITIES.map(priority => ({ value: priority.value, label: priority.label, icon: <WorkItemPriorityIcon priority={priority.value} /> }));
  const typeOptions: Choice[] = types.map(type => ({ value: type.code, label: type.name, icon: <WorkItemTypeIcon type={type.code} /> }));
  const labelOptions: Choice[] = [
    ...(labels.data ?? []).map(label => ({ value: label.id, label: label.name, icon: <WorkItemLabelDot color={label.color} /> })),
    ...workItem.labels.filter(label => !(labels.data ?? []).some(each => each.id === label.id))
      .map(label => ({ value: label.id, label: label.name, icon: <WorkItemLabelDot color={label.color} /> })),
  ];
  // 사이클: 마치지 않은 것만 고르고, 이미 든 사이클은(마쳤어도) 그대로 보인다.
  const cycleOptions: Choice[] = (cycles.data?.cycles ?? [])
    .filter(cycle => cycle.state !== 'COMPLETED' || cycle.id === workItem.cycleId)
    .map(cycle => ({ value: cycle.id!, label: cycle.name!, icon: <RepeatIcon /> }));
  if (workItem.cycleId && !cycleOptions.some(option => option.value === workItem.cycleId))
    cycleOptions.push({ value: workItem.cycleId, label: workItem.cycleName ?? '사이클', icon: <RepeatIcon /> });
  const isDisabled = !canEdit;
  const one = (value?: string | null) => (value ? [value] : []);
  const date = (label: string, value: string | undefined, onPick: (day: string | undefined) => void) => isDisabled
    ? <InfoPill label={label} icon={<CalendarIcon />}>{value ? formatWorkItemDate(value) : label}</InfoPill>
    : <DatePill label={label} value={value} format={formatWorkItemDate} onChange={onPick} />;
  const projectPath = `/workspace/projects/${encodeURIComponent(key)}/work-items`;
  return [
    {
      title: '프로젝트', items: <button type="button" data-slot="property-pill" aria-label="프로젝트" className={pillVariants()}
        onClick={() => void navigate({ href: projectPath })}>
        <ProjectsIcon /><span className="min-w-0 truncate">{workItem.projectName ?? key}</span>
      </button>,
    },
    {
      title: '속성', items: <>
        {isDisabled ? <ReadPill label="상태" icon={ListChecksIcon} options={statuses} chosen={one(workItem.columnId)} />
          : <OptionPill label="상태" icon={ListChecksIcon} value={workItem.columnId} options={statuses}
            onChange={columnId => { if (columnId !== workItem.columnId) onChange({ columnId }); }} />}
        {isDisabled ? <ReadPill label="우선순위" icon={ChartNoAxesColumnIcon} options={priorities} chosen={one(workItem.priority === 'NONE' ? undefined : workItem.priority)} />
          : <OptionPill label="우선순위" icon={ChartNoAxesColumnIcon} value={workItem.priority === 'NONE' ? undefined : workItem.priority} options={priorities}
            onChange={priority => { if (priority !== workItem.priority) onChange({ priority: priority as WorkItemPriority }); }} />}
        {isDisabled ? <ReadPill showLabel label="유형" icon={NotesIcon} options={typeOptions} chosen={one(workItem.type)} />
          : <OptionPill showLabel label="유형" icon={NotesIcon} value={workItem.type} options={typeOptions}
            onChange={type => { if (type !== workItem.type) onChange({ type: type as WorkItemType }); }} />}
        {isDisabled ? <ReadPill label="담당자" icon={UserIcon} emptyText="담당자 없음" options={assignees} chosen={one(workItem.assigneeId)} />
          : <OptionPill label="담당자" icon={UserIcon} emptyText="담당자 없음" value={workItem.assigneeId ?? undefined} options={assignees}
            onChange={assigneeId => onChange({ assigneeId: assigneeId === workItem.assigneeId ? undefined : assigneeId })} />}
        {date('시작일', workItem.startDate ?? undefined, startDate => { if (startDate !== workItem.startDate) onChange({ startDate }); })}
        {date('마감일', workItem.dueDate ?? undefined, dueDate => { if (dueDate !== workItem.dueDate) onChange({ dueDate }); })}
        {isDisabled || cycleOptions.length === 0
          ? <ReadPill label="사이클" icon={RepeatIcon} emptyText="사이클 없음" options={cycleOptions} chosen={one(workItem.cycleId)} />
          : <OptionPill label="사이클" icon={RepeatIcon} emptyText="사이클 없음" value={workItem.cycleId ?? undefined} options={cycleOptions}
            onChange={cycleId => onChange({ cycleId: cycleId === workItem.cycleId ? undefined : cycleId })} />}
      </>,
    },
    { title: '공수', items: <WorkItemEffort workItem={workItem} isDisabled={isDisabled} onChange={onChange} /> },
    {
      title: '라벨', items: isDisabled || labelOptions.length === 0
        ? <ReadPill label="라벨" icon={TagIcon} emptyText="라벨 더하기" options={labelOptions} chosen={workItem.labels.map(label => label.id)} />
        : <OptionPill label="라벨" icon={TagIcon} emptyText="라벨 더하기" isMultiple value={workItem.labels.map(label => label.id)}
          options={labelOptions} onChange={labelIds => onChange({ labelIds })} />,
    },
    {
      title: '상위 업무', items: isDisabled
        ? <ReadPill label="상위 업무" icon={BranchIcon} emptyText="상위 업무 없음" options={parentOptions} chosen={one(workItem.parentId)} />
        : <OptionPill label="상위 업무" icon={BranchIcon} emptyText="상위 업무 없음" value={workItem.parentId ?? undefined}
          options={parentOptions} onChange={parentId => onChange({ parentId: parentId === workItem.parentId ? undefined : parentId })} />,
    },
  ];
}
