import { queryOptions } from '@tanstack/react-query';
import { getJson, sendCommand, sendJson, type components } from '@/shared/api';
import { deviceName, subscriptionBody } from '../lib/push';

/** 푸시를 끌 수 있는 알림 묶음: 서버가 정한 목록(PushTopic)을 그대로 쓴다. */
export type PushTopic = NonNullable<components['schemas']['PushTopicSetting']['topic']>;
export type LastPush = { status: string; at: string; error?: string | null };
export type PushDevice = {
  id: string; deviceName?: string | null; userAgent?: string | null; createdAt: string; lastSeenAt: string; expiredAt?: string | null;
  lastPush?: LastPush | null;
};
export type PushConfig = { enabled: boolean; publicKey?: string | null };
export type PushPreferences = { topics: { topic: PushTopic; enabled: boolean }[] };

export const pushKeys = { all: ['push'] as const };


/** Whether this server pushes, and its key; it changes only with the server's settings. */
export const pushConfigOptions = () => queryOptions({
  queryKey: [...pushKeys.all, 'config'],
  queryFn: ({ signal }) => getJson<PushConfig>('/api/v1/push/config', signal),
  staleTime: Infinity,
});

/** The member's devices taking pushes, each with how its last push went; read every minute (v2 has no live signal yet). */
export const pushDevicesOptions = () => queryOptions({
  queryKey: [...pushKeys.all, 'devices'],
  queryFn: ({ signal }) => getJson<PushDevice[]>('/api/v1/push/devices', signal),
  refetchInterval: 60_000,
});

export const pushPreferencesOptions = () => queryOptions({
  queryKey: [...pushKeys.all, 'preferences'],
  queryFn: ({ signal }) => getJson<PushPreferences>('/api/v1/push/preferences', signal),
});

/** Tells the server about this browser's subscription, adding it or renewing it; the device it keeps. */
export const saveDevice = (subscription: PushSubscription) => sendJson<PushDevice>('/api/v1/push/devices', 'PUT', {
  ...subscriptionBody(subscription), deviceName: deviceName(), userAgent: navigator.userAgent.slice(0, 500),
});

export const removeDevice = (id: string) => sendCommand(`/api/v1/push/devices/${id}`, 'DELETE');

export const savePreferences = (mutedTopics: PushTopic[]) => sendJson<PushPreferences>('/api/v1/push/preferences', 'PUT', { mutedTopics });

/** A test push to one device, or every device when none is given. */
export const sendTestPush = (subscriptionId?: string) =>
  sendJson<{ devices: number }>('/api/v1/push/tests', 'POST', { subscriptionId: subscriptionId ?? null });
