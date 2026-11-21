import { queryOptions } from '@tanstack/react-query';
import { getJson, sendCommand, sendCreate } from '@/shared/api';
import type { WorkItemListView, WorkItemViewInput, WorkItemViewList } from '../model/views';

/*
 * The saved views over the work item lists, as client/'s: the workspace's at /api/v1/workspace/issue-views, a project's at
 * /api/v1/workspace/projects/{key}/issue-views, one view by its id at /api/v1/workspace/issue-views/{id}. They sit under ['workItems'], so a
 * change to work items reads them again too.
 */

const base = (key?: string) => (key ? `/api/v1/workspace/projects/${encodeURIComponent(key)}/issue-views` : '/api/v1/workspace/issue-views');
export const viewKeys = { scope: (key?: string) => ['workItems', 'views', key?.toUpperCase() ?? '*'] as const };

/** A scope's views as the reader sees them: the workspace's (no key) or a project's. */
export const workItemViewsOptions = (key?: string) => queryOptions({
  queryKey: viewKeys.scope(key),
  queryFn: ({ signal }) => getJson<WorkItemViewList>(base(key), signal),
  staleTime: 60_000,
});

const body = (input: WorkItemViewInput) => ({ ...input, name: input.name.trim() });

export type WorkItemViewChange =
  | { kind: 'create'; input: WorkItemViewInput }
  | { kind: 'edit'; view: WorkItemListView; input: WorkItemViewInput }
  | { kind: 'delete'; view: WorkItemListView }
  | { kind: 'order'; keys: string[] };

/**
 * A change to a scope's views: one made (its id comes back), changed or deleted over the version it was read at, or the
 * views put in a new order. Shared views and the order are Workspace administrators'; anyone keeps their personal ones.
 */
export async function changeWorkItemViews(scopeKey: string | undefined, change: WorkItemViewChange): Promise<string | undefined> {
  switch (change.kind) {
    case 'create': return (await sendCreate(base(scopeKey), body(change.input))).split('/').pop();
    case 'edit': await sendCommand(`/api/v1/workspace/issue-views/${change.view.id}`, 'PATCH', { expectedVersion: change.view.version, view: body(change.input) }); return undefined;
    case 'delete': await sendCommand(`/api/v1/workspace/issue-views/${change.view.id}?expectedVersion=${change.view.version}`, 'DELETE'); return undefined;
    case 'order': await sendCommand(`${base(scopeKey)}/order`, 'PUT', { keys: change.keys }); return undefined;
  }
}
