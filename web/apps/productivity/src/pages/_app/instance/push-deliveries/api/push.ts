import { queryOptions } from '@tanstack/react-query';
import { getJson, sendJson, type components } from '@/shared/api';

export type PushSummary = {
  configured: boolean; activeDevices: number; membersWithDevice: number; workingMembers: number;
  sent: number; failed: number; gone: number; noDevice: number; muted: number; pending: number;
};
export type PushMember = {
  id: string; name: string; devices: number; lastPushAt?: string | null; lastStatus?: string | null;
  sent: number; failed: number; noDevice: number;
};
export type PushDeviceRow = {
  id: string; deviceName?: string | null; userAgent?: string | null; createdAt: string; lastSeenAt: string; expiredAt?: string | null;
  lastPush?: { status: string; at: string; error?: string | null } | null;
};
export type PushDeliveryRow = {
  id: string; title: string; link?: string | null; status: string; httpStatus?: number | null; error?: string | null; attempts: number;
  createdAt: string; attemptedAt?: string | null; subscriptionId?: string | null; deviceName?: string | null; test: boolean;
};
export type PushMemberDetail = { id: string; name?: string | null; devices: PushDeviceRow[]; deliveries: PushDeliveryRow[] };
type WithRequired<T, K extends keyof T> = T & { [P in K]-?: NonNullable<T[P]> };
export type NoticeKindRow = WithRequired<components['schemas']['NoticeKindRow'], 'kind' | 'notices' | 'recipients' | 'pushed'>;
/** The members' list narrowed by a name and by those with a failed push or without a device. */
export type PushListing = { q?: string; state?: string };

export const PUSH_KEY = ['push', 'admin'] as const;
/** Read again every minute while the page is open (web has no server signal for pushes yet). */
const MINUTE = 60_000;

/** The last seven days across the company. */
export const pushSummaryOptions = () => queryOptions({
  queryKey: [...PUSH_KEY, 'summary'],
  queryFn: ({ signal }) => getJson<PushSummary>('/api/v1/push-deliveries/summary', signal),
  refetchInterval: MINUTE,
});

/** Every working member by name with their devices and latest push. */
export const pushMembersOptions = (listing: PushListing) => queryOptions({
  queryKey: [...PUSH_KEY, 'members', listing],
  queryFn: ({ signal }) => getJson<PushMember[]>(`/api/v1/push-deliveries/members?${new URLSearchParams({
    ...(listing.q ? { q: listing.q } : {}), state: listing.state ?? 'ALL',
  })}`, signal),
  refetchInterval: MINUTE,
});

/** A member's devices and pushes with the push service's answer. */
export const pushMemberOptions = (employeeId: string) => queryOptions({
  queryKey: [...PUSH_KEY, 'member', employeeId],
  queryFn: ({ signal }) => getJson<PushMemberDetail>(`/api/v1/push-deliveries/members/${employeeId}`, signal),
  refetchInterval: MINUTE,
});

/** Every kind of notice sent so far, counted over thirty days, with its latest notice as an example. */
export const noticeKindsOptions = () => queryOptions({
  queryKey: [...PUSH_KEY, 'kinds'],
  queryFn: ({ signal }) => getJson<NoticeKindRow[]>('/api/v1/push-deliveries/kinds', signal),
  refetchInterval: MINUTE,
});

/** A test push to the member's devices; how many it went to. */
export const sendMemberTest = (employeeId: string) => sendJson<{ devices: number }>(`/api/v1/push-deliveries/members/${employeeId}/tests`, 'POST');
