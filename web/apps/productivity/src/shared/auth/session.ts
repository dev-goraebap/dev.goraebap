import { queryOptions } from '@tanstack/react-query';
import { ApiError, getJson, type components } from '@/shared/api';

/** The member signed in, as the server tells it; null when nobody is. */
export type Session = components['schemas']['Me'];
/** Who is signed in, read again every minute so an ended session takes the screen back to the login. */
export const sessionOptions = () => queryOptions({
  queryKey: ['session'],
  queryFn: async ({ signal }): Promise<Session | null> => {
    try { return await getJson<Session>('/api/v1/auth/me', signal); }
    catch (error) { if (error instanceof ApiError && error.status === 401) return null; throw error; }
  },
  staleTime: 0, retry: false, refetchInterval: 60_000,
});

/** Whether the member administers anything (an instance, the office or projects): 관리 shows for them. */
export const isAdministrator = (session: Session | null | undefined) => (session?.roles?.length ?? 0) > 0;
