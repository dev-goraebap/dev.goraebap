import { queryOptions, type QueryClient } from '@tanstack/react-query';
import { getJson, sendCommand, sendCreate, type components } from '@/shared/api';

/*
 * Projects' reads and writes against /api/v1/workspace/projects, as client/'s. Every read sits under ['projects'], so a change
 * made here reads them all again. A project's key in a path is its current key or an old one, in any case.
 */

type Schemas = components['schemas'];
type WithRequired<T, K extends keyof T> = T & { [P in K]-?: NonNullable<T[P]> };

/**
 * A member's role in a project (cowork-projects 권한): a viewer reads and comments, an editor also writes issues and
 * documents, an administrator also keeps the project's settings and members. A Workspace administrator is every
 * project's administrator.
 */
export type ProjectRole = 'VIEWER' | 'EDITOR' | 'ADMIN';
export const PROJECT_ROLES: readonly ProjectRole[] = ['VIEWER', 'EDITOR', 'ADMIN'];
export const PROJECT_ROLE_LABEL: Record<ProjectRole, string> = { VIEWER: '뷰어', EDITOR: '에디터', ADMIN: '관리자' };
/** What the reader may do in a project, as the server judges it (the screens hide what they cannot; the server still decides). */
export type ProjectCan = { view: boolean; edit: boolean; manage: boolean };

/**
 * A project as the screens list and open it, with its member count, whether it is the reader's favourite, and the
 * reader's role and what it lets them do. Only projects the reader sees are listed (their members' and every one for a
 * Workspace administrator).
 */
export type Project = WithRequired<Schemas['ProjectView'], 'id' | 'key' | 'name' | 'position' | 'version' | 'memberCount' | 'favorite' | 'createdAt' | 'updatedAt'>
  & { myRole: ProjectRole | 'NONE'; can: ProjectCan };
/** One member of a project with their role, in the order they joined. */
export type ProjectMember = WithRequired<Schemas['MemberView'], 'userId' | 'name' | 'joinedAt'> & { role: ProjectRole };
/** The list's tabs: in use (in the administrators' order), archived and deleted (by name; deleted for administrators). */
export type ProjectStatus = 'ACTIVE' | 'ARCHIVED' | 'DELETED';
/** What a project is made with; no icon or colour leaves the mark to the key's first letter. */
/** A new project: its key, name and description, and its mark (an icon and colour) when one is picked. */
export type ProjectDraft = { key: string; name: string; description: string; icon?: string | null; color?: string | null };
/** Archiving, bringing back, deleting (soft) or restoring. */
export type ProjectChange = 'archive' | 'unarchive' | 'delete' | 'restore';

export const orderProjects = (ids: string[]) => sendCommand('/api/v1/workspace/projects/order', 'PUT', { ids });

const BASE = '/api/v1/workspace/projects';
const at = (key: string) => `${BASE}/${encodeURIComponent(key)}`;

export const projectKeys = {
  all: ['projects'] as const,
  list: (status: ProjectStatus) => ['projects', 'list', status] as const,
  project: (key: string) => ['projects', 'one', key.toUpperCase()] as const,
  members: (key: string) => ['projects', 'members', key.toUpperCase()] as const,
};

/** Whatever changed in projects: every project read is read again. */
export const refreshProjects = (client: QueryClient) => client.invalidateQueries({ queryKey: projectKeys.all });

/** The projects of a tab: in use (by default, the menu's), archived, or deleted (administrators only). */
export const projectsOptions = (status: ProjectStatus = 'ACTIVE') => queryOptions({
  queryKey: projectKeys.list(status),
  queryFn: ({ signal }) => getJson<Project[]>(`${BASE}?status=${status}`, signal),
});

/** One project by its key (a current key or an old one); a missing one fails as not found. */
export const projectOptions = (key: string) => queryOptions({
  queryKey: projectKeys.project(key),
  queryFn: ({ signal }) => getJson<Project>(at(key), signal),
});

export const projectMembersOptions = (key: string) => queryOptions({
  queryKey: projectKeys.members(key),
  queryFn: ({ signal }) => getJson<ProjectMember[]>(`${at(key)}/members`, signal),
});

/** Who belongs to which live project with which role, of the projects the reader sees, as GET /projects/members. */
export type ProjectMembership = { projectId: string; userId: string; role: ProjectRole };

export const projectMembershipsOptions = () => queryOptions({
  queryKey: [...projectKeys.all, 'memberships'] as const,
  queryFn: ({ signal }) => getJson<ProjectMembership[]>(`${BASE}/members`, signal),
});

/** A key: 2–10 Latin capitals and digits, the prefix of its work item numbers. */
export const PROJECT_KEY = /^[A-Z0-9]{2,10}$/;
/** A name's longest, as the server keeps it. */
export const PROJECT_NAME_MAX = 64;
/** A key offered from the name: its Latin letters and digits, upper case, up to four. */
export const keyFrom = (name: string) => name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4);

/** A new project, whose maker joins it; the new project's key comes back. */
export async function createProject(draft: ProjectDraft): Promise<string> {
  const location = await sendCreate(BASE, { key: draft.key.trim().toUpperCase(), name: draft.name.trim(), description: draft.description.trim() || undefined,
    icon: draft.icon ?? undefined, color: draft.color ?? undefined });
  return decodeURIComponent(location.split('/').pop() ?? '');
}

/**
 * The project's key, name, description and mark, saved together over the version the screen read (409
 * PROJECT_VERSION_CONFLICT when someone saved first, PROJECT_KEY_CONFLICT for a key another project has or had).
 */
export const editProject = (project: Project, draft: ProjectDraft) => sendCommand(at(project.key), 'PATCH', {
  expectedVersion: project.version, key: draft.key.trim().toUpperCase(), name: draft.name.trim(), description: draft.description.trim() || undefined,
  icon: draft.icon ?? undefined, color: draft.color ?? undefined,
});

/** Archiving, bringing back, deleting or restoring, over the version the screen read. */
export const changeProject = (project: Project, change: ProjectChange) => (change === 'delete'
  ? sendCommand(`${at(project.key)}?expectedVersion=${project.version}`, 'DELETE')
  : sendCommand(`${at(project.key)}/${change}`, 'POST', { expectedVersion: project.version }));

/**
 * A member's role in a project, or none to take them out (who then no longer sees it); the project's administrators
 * say. Someone not yet in joins with the role. The last administrator stays (409 PROJECT_LAST_ADMIN).
 */
export const setProjectRole = (key: string, userId: string, role: ProjectRole | null, isIn: boolean) => {
  const member = `${at(key)}/members/${encodeURIComponent(userId)}`;
  if (role === null) return sendCommand(member, 'DELETE');
  return isIn ? sendCommand(member, 'PATCH', { role }) : sendCommand(`${at(key)}/members`, 'POST', { userId, role });
};

