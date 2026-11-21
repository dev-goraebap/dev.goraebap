import { infiniteQueryOptions, keepPreviousData, queryOptions, useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { getJson, sendCommand, type components } from '@/shared/api';

type Item = components['schemas']['NotificationItem'];
export type NotificationItem = Item & Required<Pick<Item, 'id' | 'kind' | 'title' | 'createdAt'>>;
export type NotificationSlice = { items: NotificationItem[]; nextCursor?: string };
/** The list's conditions as the API reads them: read state. */
export type NotificationListing = { read?: 'unread' | 'read' };

export const notificationKeys = { all: ['notifications'] as const };
const PAGE_SIZE = 20;

/** The member's notices matching the listing, newest first, read one slice after another. */
export const notificationsOptions = (listing: NotificationListing) => infiniteQueryOptions({
  queryKey: [...notificationKeys.all, 'list', listing],
  queryFn: ({ pageParam, signal }) => {
    const params = new URLSearchParams({ size: String(PAGE_SIZE) });
    if (listing.read) params.set('read', listing.read.toUpperCase());
    if (pageParam) params.set('cursor', pageParam);
    return getJson<NotificationSlice>(`/api/v1/notifications?${params}`, signal);
  },
  initialPageParam: undefined as string | undefined,
  getNextPageParam: last => last.nextCursor ?? undefined,
  placeholderData: keepPreviousData,
});

/** How many notices wait, checked every minute and when the window regains focus (v2 has no live signal yet). */
export const unreadNotificationsOptions = () => queryOptions({
  queryKey: [...notificationKeys.all, 'unread'],
  queryFn: ({ signal }) => getJson<{ count: number }>('/api/v1/notifications/unread-count', signal),
  refetchInterval: 60_000,
});

/**
 * Reading marks the rows read where they are, so a list read far into keeps its place, and the unread count is read
 * again.
 */
function useNotificationCommand<T>(send: (input: T) => Promise<unknown>, isRead: (row: NotificationItem, input: T) => boolean) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: send,
    onSuccess: (_, input) => {
      const readAt = new Date().toISOString();
      client.setQueriesData<InfiniteData<NotificationSlice>>({ queryKey: [...notificationKeys.all, 'list'] }, data => data && {
        ...data, pages: data.pages.map(page => ({ ...page, items: page.items.map(row => (!row.readAt && isRead(row, input) ? { ...row, readAt } : row)) })),
      });
    },
    onSettled: () => client.invalidateQueries({ queryKey: [...notificationKeys.all, 'unread'] }),
  });
}

export const useReadNotification = () =>
  useNotificationCommand((id: string) => sendCommand(`/api/v1/notifications/${id}/reads`, 'POST'), (row, id) => row.id === id);
export const useReadAllNotifications = () =>
  useNotificationCommand(() => sendCommand('/api/v1/notifications/reads', 'POST'), () => true);
