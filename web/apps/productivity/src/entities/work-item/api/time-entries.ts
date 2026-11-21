import { queryOptions } from '@tanstack/react-query';
import { getJson, sendCommand, sendCreate, type components } from '@/shared/api';
import { workItemPath } from './work-items';

export type TimeEntries = components['schemas']['TimeEntries'];
export type TimeEntryInput = components['schemas']['TimeEntryInput'];

/** A work item's time spent (소요시간), the latest day first, with its sum and estimate. Under ['workItems'], read again with them. */
export const timeEntriesOptions = (key: string, number: number) => queryOptions({
  queryKey: ['workItems', 'time', key.toUpperCase(), number] as const,
  queryFn: ({ signal }) => getJson<TimeEntries>(`${workItemPath(key, number)}/time-entries`, signal),
});

/** Logs time one spent on a work item: hours, the day (today when none) and a short note. */
export const logTime = (key: string, number: number, input: TimeEntryInput) =>
  sendCreate(`${workItemPath(key, number)}/time-entries`, input);

/** Deletes one's own entry (a Workspace administrator anyone's). */
export const deleteTimeEntry = (key: string, number: number, id: string) =>
  sendCommand(`${workItemPath(key, number)}/time-entries/${encodeURIComponent(id)}`, 'DELETE');

/** The story points a work item may have (planning poker's; 5 and up is worth splitting). */
export const STORY_POINTS = [0.5, 1, 2, 3, 5, 8, 13] as const;

/** Hours as the screens say them: 1.5시간, 45분. */
export function formatHours(hours: number): string {
  const minutes = Math.round(hours * 60);
  if (minutes < 60) return `${minutes}분`;
  const whole = Math.round(hours * 100) / 100;
  return `${whole}시간`;
}
