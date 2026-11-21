import { queryOptions } from '@tanstack/react-query';
import { getJson, sendCommand } from '@/shared/api';

/** Whether the install still waits for its first administrator (nobody registered yet). */
export const setupOptions = () => queryOptions({
  queryKey: ['setup'],
  queryFn: ({ signal }) => getJson<{ needed: boolean }>('/api/v1/setup', signal),
  staleTime: 0,
});

/** Makes the install's first administrator; refused once anybody is registered. */
export const createFirstAdmin = (admin: { name: string; email: string }) => sendCommand('/api/v1/setup', 'POST', admin);
