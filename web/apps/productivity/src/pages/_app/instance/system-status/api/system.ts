import { infiniteQueryOptions, keepPreviousData, queryOptions } from '@tanstack/react-query';
import { ApiError, getJson } from '@/shared/api';

export type TrafficRange = 'DAY' | 'WEEK' | 'MONTH';

export type SystemStatus = {
  version: string; startedAt: string; uptimeSeconds: number; businessDbBytes: number;
  runtime: { heapUsed: number; heapMax: number; processCpu?: number | null; systemCpu?: number | null; processors: number; threads: number };
  disk: { free: number; total: number };
  logStore: { ok: boolean; failingSince?: string | null; problem?: string | null; lost: number; bytes: number };
  lastBackup?: { at: string; objectKey?: string | null; bytes?: number | null; error?: string | null } | null;
};
export type TrafficBucket = {
  at: string; ok: number; clientErrors: number; serverErrors: number; avgMs?: number | null; maxMs: number; slow: number;
  activities: number; activeMembers: number; errors: number;
};
export type RouteRow = { method: string; route: string; requests: number; avgMs: number; maxMs: number; serverErrors: number };
export type Traffic = {
  range: TrafficRange;
  totals: { requests: number; serverErrors: number; slow: number; activities: number; activeMembers: number; errors: number };
  buckets: TrafficBucket[]; busiest: RouteRow[]; slowest: RouteRow[];
};
/**
 * One thing a member did: a CHANGE (a change or a read worth keeping, with its method, target, status, time and trace
 * id) or a VISIT (a main screen opened, route being the screen; at is the first opening, lastAt the last within 30
 * minutes of each other, visits how many).
 */
export type ActivityRow = {
  id: number; kind: 'CHANGE' | 'VISIT'; at: string; lastAt?: string | null; visits?: number | null;
  employeeId?: string | null; employeeName?: string | null; ip: string;
  method?: string | null; route: string; target?: string | null; status?: number | null; durationMs?: number | null;
  traceId?: string | null; userAgent?: string | null;
};
export type ErrorRow = {
  id: number; firstAt: string; lastAt: string; occurrences: number; level: string; logger: string; message: string;
  exception?: string | null; traceId?: string | null; method?: string | null; path?: string | null; employeeId?: string | null;
  employeeName?: string | null; ip?: string | null;
};
type Slice<T> = { items: T[]; nextCursor?: string | null };

/** What the activities are narrowed by: a member, a kind, how a change ended, words in the path or screen, a span of days. */
export type ActivityListing = { employeeId?: string; kind?: string; outcome?: string; q?: string; from?: string; to?: string };
/** What the server's errors are narrowed by: a level and a span of days. */
export type ErrorListing = { level?: string; from?: string; to?: string };

/** The log store answered that it cannot be read: the page says so instead of a plain failure. */
export const isLogUnavailable = (error: unknown) => error instanceof ApiError && error.code === 'SYSTEM_LOG_UNAVAILABLE';

const SYSTEM_KEY = ['system'] as const;
const MINUTE = 60_000;
/** Status and traffic read within this long are shown again at once when a tab or range is opened again. */
const FRESH = 30_000;

/** The server now; read again every minute while the page is open. */
export const statusOptions = () => queryOptions({
  queryKey: [...SYSTEM_KEY, 'status'],
  queryFn: ({ signal }) => getJson<SystemStatus>('/api/v1/system/status', signal),
  staleTime: FRESH,
  refetchInterval: MINUTE,
});

/** The range's use, by hour (a day) or by day (a week, a month), with the busiest and slowest APIs. */
export const trafficOptions = (range: TrafficRange) => queryOptions({
  queryKey: [...SYSTEM_KEY, 'traffic', range],
  queryFn: ({ signal }) => getJson<Traffic>(`/api/v1/system/traffic?range=${range}`, signal),
  staleTime: FRESH,
  refetchInterval: MINUTE,
  placeholderData: keepPreviousData,
});

const sliceOptions = <T>(kind: 'activities' | 'errors', params: Record<string, string | undefined>) => infiniteQueryOptions({
  queryKey: [...SYSTEM_KEY, kind, params],
  queryFn: ({ pageParam, signal }) => {
    const query = new URLSearchParams(Object.entries(params).filter((entry): entry is [string, string] => !!entry[1]));
    if (pageParam) query.set('cursor', pageParam);
    return getJson<Slice<T>>(`/api/v1/system/${kind}?${query}`, signal);
  },
  initialPageParam: undefined as string | undefined,
  getNextPageParam: last => last.nextCursor ?? undefined,
  placeholderData: keepPreviousData,
});

/** What members did and which main screens they opened, newest first. */
export const activitiesOptions = (listing: ActivityListing) => sliceOptions<ActivityRow>('activities', listing);

/** What the server logged as errors and warnings, newest first. */
export const errorsOptions = (listing: ErrorListing) => sliceOptions<ErrorRow>('errors', listing);

/** One error with its stack as the server logged it. */
export const errorOptions = (id: number) => queryOptions({
  queryKey: [...SYSTEM_KEY, 'error', id],
  queryFn: ({ signal }) => getJson<{ error: ErrorRow; stack?: string | null }>(`/api/v1/system/errors/${id}`, signal),
});
