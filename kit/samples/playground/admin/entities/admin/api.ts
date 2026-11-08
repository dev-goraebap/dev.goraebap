import { queryOptions } from '@tanstack/react-query';
import { createContext, useContext } from 'react';
import type { Matrix, Role, Tag, TagInput, User, UserStatus } from './model';

/** 중복 이름·이미 있는 이메일처럼 칸 곁에 알릴 수 있는 거절. */
export type Rejection = Error & { code: 'duplicate'; value: string };
export const isRejection = (error: unknown): error is Rejection => error instanceof Error && (error as Partial<Rejection>).code === 'duplicate';

export interface AdminApi {
  tags: {
    list(signal?: AbortSignal): Promise<Tag[]>;
    create(input: TagInput): Promise<Tag>;
    update(id: string, patch: Partial<TagInput>): Promise<Tag>;
    remove(id: string): Promise<void>;
  };
  users: {
    list(signal?: AbortSignal): Promise<User[]>;
    invite(input: { emails: string[]; role: Role }): Promise<User[]>;
    update(ids: string[], patch: { role?: Role; status?: UserStatus }): Promise<void>;
    resend(id: string): Promise<void>;
  };
  permissions: {
    get(signal?: AbortSignal): Promise<Matrix>;
    save(matrix: Matrix): Promise<Matrix>;
  };
}

export const AdminApiContext = createContext<AdminApi | null>(null);
export function useAdminApi() {
  const api = useContext(AdminApiContext);
  if (!api) throw new Error('AdminApiContext가 필요합니다.');
  return api;
}

/** 조회를 소유한 슬라이스에 키·요청·옵션을 함께 둔다. */
export const adminKeys = { tags: ['admin', 'tags'] as const, users: ['admin', 'users'] as const, permissions: ['admin', 'permissions'] as const };
export const adminQueries = {
  tags: (api: AdminApi) => queryOptions({ queryKey: adminKeys.tags, queryFn: ({ signal }) => api.tags.list(signal), staleTime: 30_000 }),
  users: (api: AdminApi) => queryOptions({ queryKey: adminKeys.users, queryFn: ({ signal }) => api.users.list(signal), staleTime: 30_000 }),
  permissions: (api: AdminApi) => queryOptions({ queryKey: adminKeys.permissions, queryFn: ({ signal }) => api.permissions.get(signal), staleTime: 30_000 }),
};
