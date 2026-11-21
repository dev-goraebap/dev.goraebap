import { useQuery } from '@tanstack/react-query';
import { ApiError } from '@/shared/api';
import { sessionOptions } from '@/shared/auth';

/** Whether the signed-in member runs Projects: makes, archives, deletes and staffs projects, and keeps shared views. */
export function useIsWorkspaceAdmin(): boolean {
  return (useQuery(sessionOptions()).data?.roles ?? []).includes('WORKSPACE_ADMIN');
}

/** Whether the server refused for this reason (PROJECT_KEY_CONFLICT …). */
export const isProjectError = (error: unknown, code: string) => error instanceof ApiError && error.code === code;
