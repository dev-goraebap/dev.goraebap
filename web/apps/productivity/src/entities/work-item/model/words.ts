import { ChartNoAxesColumnIcon, CircleCheckIcon, CirclePauseIcon, CircleXIcon, ClockIcon, RefreshCwIcon, SirenIcon, type Icon } from '@/shared/ui/kit/icon';
import type { ColumnCategory, WorkItemPriority } from './types';

/**
 * A mark's ink: the theme's mark tokens (app/theme/tailwind.css, light and dark) as text classes, so status and priority read
 * by colour as well as by shape. A mark with none takes the muted icon ink.
 */
export type MarkTone = 'text-mark-backlog' | 'text-mark-progress' | 'text-mark-done' | 'text-mark-urgent' | 'text-mark-high' | 'text-mark-medium'
  | 'text-mark-low' | 'text-icon-muted';
type Mark = { label: string; icon: Icon; tone: MarkTone };

/** Priorities from the most pressing, then none: urgent a siren, the rest graded bars or three dashes. */
export const PRIORITIES: readonly ({ value: WorkItemPriority } & Mark)[] = [
  { value: 'URGENT', label: '긴급', icon: SirenIcon, tone: 'text-mark-urgent' },
  { value: 'HIGH', label: '높음', icon: ChartNoAxesColumnIcon, tone: 'text-mark-high' },
  { value: 'MEDIUM', label: '보통', icon: ChartNoAxesColumnIcon, tone: 'text-mark-medium' },
  { value: 'LOW', label: '낮음', icon: ChartNoAxesColumnIcon, tone: 'text-mark-low' },
  { value: 'NONE', label: '없음', icon: ChartNoAxesColumnIcon, tone: 'text-icon-muted' },
];

/**
 * The five status categories (BIT's), in the board's flow, each with the Solar icon its columns are drawn with: circles
 * where Solar has them (pause, check, cross), so they read as one family.
 */
export const CATEGORIES: readonly ({ value: ColumnCategory } & Mark)[] = [
  { value: 'BACKLOG', label: '백로그', icon: CirclePauseIcon, tone: 'text-mark-backlog' },
  { value: 'UNSTARTED', label: '할 일', icon: ClockIcon, tone: 'text-icon-muted' },
  { value: 'STARTED', label: '진행 중', icon: RefreshCwIcon, tone: 'text-mark-progress' },
  { value: 'COMPLETED', label: '완료', icon: CircleCheckIcon, tone: 'text-mark-done' },
  { value: 'CANCELED', label: '취소', icon: CircleXIcon, tone: 'text-mark-backlog' },
];

const find = <T extends { value: string }>(list: readonly T[], value: string) => list.find(each => each.value === value) ?? list[0]!;
export const priorityMark = (priority: WorkItemPriority) => find(PRIORITIES, priority);
export const categoryMark = (category: ColumnCategory) => find(CATEGORIES, category);

/** Whether a category closes a work item (done or dropped). */
export const isClosing = (category: ColumnCategory) => category === 'COMPLETED' || category === 'CANCELED';

