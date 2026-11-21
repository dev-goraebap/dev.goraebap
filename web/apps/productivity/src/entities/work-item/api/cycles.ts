import { queryOptions } from '@tanstack/react-query';
import { getJson, sendCommand, sendCreate, sendJson, type components } from '@/shared/api';

export type Cycle = components['schemas']['CycleView'];
export type CycleList = components['schemas']['CycleList'];
export type CycleInput = components['schemas']['CycleInput'];
export type CycleSettings = components['schemas']['CycleSettings'];

const base = (key: string) => `/api/v1/workspace/projects/${encodeURIComponent(key)}/cycles`;

/** A project's cycles (스프린트), the earliest first, with what each holds. Under ['workItems'], read again with them. */
export const cyclesOptions = (key: string) => queryOptions({
  queryKey: ['workItems', 'cycles', key.toUpperCase()] as const,
  queryFn: ({ signal }) => getJson<CycleList>(base(key), signal),
  staleTime: 30_000,
});

export const createCycle = async (key: string, input: CycleInput) => (await sendCreate(base(key), input)).split('/').pop()!;
export const editCycle = (key: string, cycle: Cycle, input: CycleInput) =>
  sendCommand(`${base(key)}/${cycle.id}`, 'PATCH', { ...input, expectedVersion: cycle.version });
/** Finishes a cycle; its unfinished work items go to moveTo (or none). How many moved comes back. */
export const completeCycle = (key: string, cycle: Cycle, moveTo?: string) =>
  sendJson<{ moved: number }>(`${base(key)}/${cycle.id}/complete`, 'POST', { expectedVersion: cycle.version, moveTo });
/** How the project runs its cycles (Workspace administrators); turned on, the cycles due are made at once. */
export const saveCycleSettings = (key: string, settings: CycleSettings) => sendCommand(`${base(key)}/settings`, 'PUT', settings);
export const deleteCycle = (key: string, cycle: Cycle) => sendCommand(`${base(key)}/${cycle.id}`, 'DELETE');

export const CYCLE_STATES: Record<NonNullable<Cycle['state']>, string> = {
  UPCOMING: '예정', CURRENT: '진행 중', ENDED: '기간 끝남', COMPLETED: '마침',
};

/** A cycle's days as the screens say them: 11월 3일 – 11월 16일. */
export function cycleDays(cycle: Pick<Cycle, 'startDate' | 'endDate'>): string {
  const day = (value?: string) => (value ? new Date(`${value}T00:00:00`).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' }) : '');
  return `${day(cycle.startDate)} – ${day(cycle.endDate)}`;
}
