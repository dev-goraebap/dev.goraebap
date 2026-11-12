import type { JSONContent } from '@tiptap/react';

export type IssueStatus = 'todo' | 'doing' | 'review' | 'done';
export type IssuePriority = 'urgent' | 'high' | 'medium' | 'low';
export type IssueComment = { id: string; author: string; text: string; at: string; parentId?: string; quote?:string; editedAt?: string };
export type IssueEvent={id:string;at:string;actor:string;text:string};
export type Issue = {
  type?: 'task'|'bug'|'improvement';
  start?:string; labels?:string[]; events?:IssueEvent[];
  /** 사람이 부르는 키(ISS-12). 주소에도 쓴다. */
  id: string;
  title: string;
  body: JSONContent;
  status: IssueStatus;
  priority: IssuePriority;
  assignee?: string;
  /** 마감일(YYYY-MM-DD). */
  due?: string;
  /** 상위 이슈의 키. */
  parent?: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  comments: IssueComment[];
};
export type NewIssue = Pick<Issue, 'title' | 'body' | 'status' | 'priority' | 'assignee' | 'due' | 'parent' | 'type' | 'labels' | 'start'>;
export type IssuePatch = Partial<Pick<Issue, 'title' | 'body' | 'status' | 'priority' | 'assignee' | 'due' | 'parent' | 'type' | 'labels' | 'start'>>;

/** 보드의 칸이자 목록의 그룹 순서. 표식(아이콘 · 색)은 ui의 StatusMark가 정한다. */
export const statuses: { id: IssueStatus; label: string }[] = [
  { id: 'todo', label: '할 일' },
  { id: 'doing', label: '진행 중' },
  { id: 'review', label: '검토 중' },
  { id: 'done', label: '완료' },
];
export const statusOf = (id: IssueStatus) => statuses.find(each => each.id === id)!;

/** rank가 클수록 급하다(정렬 기준). */
export const priorities: { id: IssuePriority; label: string; rank: number }[] = [
  { id: 'urgent', label: '긴급', rank: 4 },
  { id: 'high', label: '높음', rank: 3 },
  { id: 'medium', label: '보통', rank: 2 },
  { id: 'low', label: '낮음', rank: 1 },
];
export const priorityOf = (id: IssuePriority) => priorities.find(each => each.id === id)!;

export const people = ['서윤', '지우', '도현', '민준', '하은'];
/** 지정하지 않은 담당자를 거르는 필터 값. */
export const NONE = 'none';
/** 이 앱을 쓰는 사람. */
export const me = '서윤';
/** 견본의 오늘. 마감이 지났는지와 "N일 뒤"를 이 날짜로 계산한다. */
export const today = '2026-11-08';

export const isOverdue = (issue: Pick<Issue, 'due' | 'status'>) => !!issue.due && issue.status !== 'done' && issue.due < today;

export const dateText = (value: string) =>
  new Intl.DateTimeFormat('ko', { month: 'long', day: 'numeric', timeZone: 'UTC' }).format(new Date(value.length === 10 ? `${value}T00:00:00Z` : value));
export const timeText = (value: string) =>
  new Intl.DateTimeFormat('ko', { month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'UTC' }).format(new Date(value));

const between = (from: string, to: string) => Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
/** 마감까지의 거리: 오늘 · 내일 · N일 뒤 · N일 지남. */
export function dueText(day: string) {
  const days = between(today, day);
  return days === 0 ? '오늘' : days === 1 ? '내일' : days > 1 ? `${days}일 뒤` : `${-days}일 지남`;
}
/** "11월 12일 (목)": 날짜 자체가 중요한 값(시작일). */
export const absoluteText = (day: string) => new Intl.DateTimeFormat('ko', { month: 'long', day: 'numeric', weekday: 'short', timeZone: 'UTC' })
  .format(new Date(`${day}T00:00:00Z`));

export function plainText(node?: JSONContent): string {
  return node?.text ?? node?.content?.map(plainText).join(' ') ?? '';
}
