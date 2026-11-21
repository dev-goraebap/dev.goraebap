import { PersonAvatar } from '@/shared/ui/person';
import { ChartNoAxesColumnIcon, NotesIcon, RepeatIcon, TagIcon, UserIcon, WorkflowIcon } from '@/shared/ui/kit/icon';
import type { Option } from '@/shared/ui/kit/option-list';
import { PRIORITIES, VIEW_FILTER_KEYS, VIEW_GROUPINGS, VIEW_SORTS, WorkItemLabelDot, WorkItemPriorityIcon, WorkItemStatusIcon,
  WorkItemTypeIcon, cycleDays, type BoardColumn, type Cycle, type WorkItemLabel, type WorkItemTypeRow, type WorkItemListView, type WorkItemListing, type WorkItemPerson,
  type WorkItemViewFilters, type WorkItemViewGrouping, type WorkItemViewSort,
} from '@/entities/work-item';
import type { Display, SortKey, WorkItemFilterDef, WorkItemQuery } from './use-work-item-filters';

type FilterOption = Option;

/** The people to filter by, as client/'s: 나 and 담당자 없음 first, then the working members by name. */
export const peopleChoices = (people: readonly WorkItemPerson[] = []): FilterOption[] => [
  { value: 'me', label: '나', icon: <UserIcon className="text-icon-muted" /> },
  { value: 'none', label: '담당자 없음', icon: <UserIcon className="text-icon-muted opacity-50" /> },
  ...people.map(person => ({ value: person.id, label: person.name, icon: <PersonAvatar id={person.id} name={person.name} size="xsm" isStatic /> })),
];

const typeChoices = (types: readonly WorkItemTypeRow[]): FilterOption[] =>
  types.map(type => ({ value: type.code, label: type.name, icon: <WorkItemTypeIcon type={type.code} /> }));
const priorityChoices: FilterOption[] = PRIORITIES.map(priority => ({ value: priority.value, label: priority.label, icon: <WorkItemPriorityIcon priority={priority.value} /> }));

/**
 * A project's filters, as client/'s: 상태 (its columns), 담당자, 라벨, 유형, 우선순위, 사이클 (the one under way, none, or
 * any of the project's), each several values at once.
 */
export function projectFilters({ columns = [], labels = [], types = [], people, cycles = [] }: {
  columns?: readonly BoardColumn[]; labels?: readonly WorkItemLabel[]; types?: readonly WorkItemTypeRow[]; people?: readonly WorkItemPerson[];
  cycles?: readonly Cycle[];
}): WorkItemFilterDef[] {
  return [
    { key: 'status', label: '상태', icon: WorkflowIcon,
      options: columns.map(column => ({ value: column.id, label: column.name, icon: <WorkItemStatusIcon category={column.category} /> })) },
    { key: 'assignee', label: '담당자', icon: UserIcon, isSearchable: true, options: peopleChoices(people) },
    { key: 'label', label: '라벨', icon: TagIcon, isSearchable: true,
      options: labels.map(label => ({ value: label.id, label: label.name, icon: <WorkItemLabelDot color={label.color} /> })) },
    { key: 'type', label: '유형', icon: NotesIcon, options: typeChoices(types) },
    { key: 'priority', label: '우선순위', icon: ChartNoAxesColumnIcon, options: priorityChoices },
    { key: 'cycle', label: '사이클', icon: RepeatIcon, options: [
      { value: 'current', label: '진행 중인 사이클', icon: <RepeatIcon className="text-icon-muted" /> },
      { value: 'none', label: '사이클 없음', icon: <RepeatIcon className="text-icon-muted" /> },
      ...[...cycles].reverse().map(cycle => ({ value: cycle.id!, label: `${cycle.name} (${cycleDays(cycle)})`, icon: <RepeatIcon className="text-icon-muted" /> })),
    ] },
  ];
}

/** The orders 표시 offers: a project's board order first, then by change and by making. */
export const sortsOf = (isProject: boolean): SortKey[] =>
  VIEW_SORTS.filter(sort => isProject || sort.value !== 'BOARD').map(sort => ({ id: sort.value, label: sort.label, kind: sort.kind }));

/** The groupings 표시 offers; 프로젝트 only across the workspace. */
export const groupsOf = (isProject: boolean) =>
  VIEW_GROUPINGS.filter(group => !isProject || group.value !== 'PROJECT').map(group => ({ id: group.value, label: group.label }));

/** What a view shows by itself: its filters' values, its order and grouping. */
export function queryOf(view: WorkItemListView): WorkItemQuery {
  const state = Object.fromEntries(VIEW_FILTER_KEYS.flatMap(key => (view.filters[key] ? [[key, view.filters[key]!.split(',')]] : [])));
  return { state, display: { sort: view.sort, direction: view.direction === 'ASC' ? 'asc' : 'desc', group: view.grouping } };
}

/** A query's filters as a view keeps them, several values of one joined by commas; 프로젝트 only across the workspace. */
export function viewFiltersOf(query: WorkItemQuery, isProject: boolean): WorkItemViewFilters {
  return Object.fromEntries(VIEW_FILTER_KEYS.flatMap(key => {
    const values = query.state[key] ?? [];
    return values.length > 0 && (key !== 'project' || !isProject) ? [[key, values.join(',')]] : [];
  })) as WorkItemViewFilters;
}

/** Whether a query differs from what its view keeps, so it may be saved to the view or put back. */
export function isChangedFrom(view: WorkItemListView, query: WorkItemQuery, isProject: boolean): boolean {
  const own = queryOf(view);
  const mine = viewFiltersOf(query, isProject);
  return VIEW_FILTER_KEYS.some(key => (mine[key] ?? '') !== (view.filters[key] ?? ''))
    || query.display.sort !== own.display.sort || query.display.direction !== own.display.direction || query.display.group !== own.display.group;
}

/**
 * What the list asks the server for under a query: in a project status names columns, across the workspace categories;
 * a board always reads in board order.
 */
export function listingOf(query: WorkItemQuery, isProject: boolean, isBoard: boolean): WorkItemListing {
  const join = (key: string) => (query.state[key]?.length ? query.state[key].join(',') : undefined);
  const listing: WorkItemListing = {
    project: isProject ? undefined : join('project'),
    columnId: isProject ? join('status') : undefined,
    category: !join('status') && isBoard ? 'UNSTARTED,STARTED,COMPLETED,CANCELED' : isProject ? undefined : join('status'),
    assignee: join('assignee'), labelId: isProject ? join('label') : undefined, type: join('type'), priority: join('priority'),
    cycle: isProject ? join('cycle') : undefined,
    sort: query.display.sort as WorkItemViewSort, direction: query.display.direction === 'asc' ? 'ASC' : 'DESC',
  };
  return Object.fromEntries(Object.entries(listing).filter(([, value]) => value !== undefined)) as WorkItemListing;
}

/** Whether any filter narrows the list. */
export const isNarrowed = (query: WorkItemQuery) => Object.values(query.state).some(values => values.length > 0);

export const groupingOf = (display: Display) => display.group as WorkItemViewGrouping;
