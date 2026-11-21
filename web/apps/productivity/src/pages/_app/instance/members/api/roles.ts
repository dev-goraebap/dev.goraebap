import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { getJson, sendCommand, sendJson } from '@/shared/api';

/** The two administrator roles, neither holding the other: 인스턴스 관리자, 워크스페이스 관리자. */
export type Role = 'INSTANCE_ADMIN' | 'WORKSPACE_ADMIN';
export const ROLES: readonly Role[] = ['INSTANCE_ADMIN', 'WORKSPACE_ADMIN'];
export const ROLE_LABEL: Record<Role, string> = { INSTANCE_ADMIN: '인스턴스 관리자', WORKSPACE_ADMIN: '워크스페이스 관리자' };

/** A member who may hold roles: active, with the roles they hold now. */
export type RoleHolder = { id: string; name: string; email: string; roles: Role[] };

const ROLES_KEY = ['instance-roles'] as const;

/** Every active member and their roles, by name. */
export const rolesOptions = () => queryOptions({
  queryKey: ROLES_KEY,
  queryFn: ({ signal }) => getJson<RoleHolder[]>('/api/v1/admin/roles', signal),
});

/** Sets a member's roles as a whole; one's own change reaches one's session (the menus it shows) too. */
export function useSetRoles() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, roles }: { id: string; roles: Role[] }) => sendCommand(`/api/v1/admin/roles/${id}`, 'PUT', { roles }),
    onSuccess: () => Promise.all([client.invalidateQueries({ queryKey: ROLES_KEY }), client.invalidateQueries({ queryKey: ['session'] })]),
  });
}

/** Adds a member by name and e-mail, who may sign in at once (a code to that e-mail); roles are given apart. */
export function useAddMember() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (member: { name: string; email: string }) => sendJson<RoleHolder>('/api/v1/admin/members', 'POST', member),
    onSuccess: () => client.invalidateQueries({ queryKey: ROLES_KEY }),
  });
}
