import type { components } from '@/shared/api';

type Schemas = components['schemas'];
type WithRequired<T, K extends keyof T> = T & { [P in K]-?: NonNullable<T[P]> };

/** A work item type's code (TASK, BUG … or one an administrator added). */
export type WorkItemType = string;
/** One of the workspace's work item types: its code, name, mark, place, whether it is the default, and how many work items keep it. */
export type WorkItemTypeRow = WithRequired<Schemas['TypeView'], 'code' | 'name' | 'icon' | 'color' | 'position' | 'isDefault' | 'uses'>;
export type WorkItemPriority = NonNullable<Schemas['IssueRow']['priority']>;
/** What a status means (BIT's five), whatever a project calls its column. */
export type ColumnCategory = NonNullable<Schemas['IssueRow']['category']>;
export type LabelChip = WithRequired<Schemas['LabelChip'], 'id' | 'name' | 'color'>;

/** A work item as lists, tables and the board show it: its project, reference (KEY-number), status, place and properties. */
export type WorkItemRow = Omit<WithRequired<Schemas['IssueRow'], 'id' | 'projectId' | 'projectKey' | 'projectName' | 'ref' | 'number' | 'title' | 'type'
  | 'columnId' | 'columnName' | 'category' | 'position' | 'priority' | 'childCount' | 'createdAt' | 'updatedAt' | 'version'>, 'labels'> & { labels: LabelChip[] };
export type WorkItemSlice = { items: WorkItemRow[]; nextCursor?: string };
export type WorkItemRef = WithRequired<Schemas['IssueRef'], 'id' | 'ref' | 'number' | 'title' | 'category'>;
/** A work item opened: its row, parent, live children, maker, and whether the reader may change it (not in an archived project). */
export type WorkItemView = Omit<WithRequired<Schemas['IssueView'], 'canWrite'>, 'issue' | 'parent' | 'children'> & { issue: WorkItemRow; parent?: WorkItemRef; children: WorkItemRow[] };
export type TimelineEntry = WithRequired<Schemas['TimelineEntry'], 'kind' | 'id' | 'at'>;
/** A project's board column: a status its work items move through, in the board's order. */
export type BoardColumn = WithRequired<Schemas['ColumnView'], 'id' | 'name' | 'category' | 'position'>;
export type WorkItemLabel = WithRequired<Schemas['LabelView'], 'id' | 'name' | 'color' | 'position'>;
/** A working member a work item can be given to. */
export type WorkItemPerson = { id: string; name: string };

/** What a work item is made or changed with; the project is the key the request goes to. */
export type WorkItemDraft = {
  title: string; type: WorkItemType; priority: WorkItemPriority; columnId?: string; assigneeId?: string;
  startDate?: string; dueDate?: string; parentId?: string; labelIds: string[];
  /** The planned effort: hours (계획공수) and story points. */
  estimateHours?: number; storyPoints?: number;
  /** The cycle (스프린트) it belongs to. */
  cycleId?: string;
};
