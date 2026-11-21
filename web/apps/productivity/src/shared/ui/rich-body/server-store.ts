import { queryOptions, type QueryClient } from '@tanstack/react-query';
import type { JSONNode } from '@/shared/lib/rich-document';
import { getJson, sendJson, sendCommand, type components } from '@/shared/api';
import type { BodyEditor, RichBodySnapshot, RichBodyStore } from './use-rich-body';

type BodyState = components['schemas']['RichBodyState'];

/** The server's body (RichBodyState) as RichBody holds it: the body, its kept versions and file addresses. */
function snapshotOf(state: BodyState): RichBodySnapshot {
  return {
    version: state.version,
    body: (state.body ?? null) as JSONNode | null,
    versions: state.versions.map(version => ({
      id: version.id, reason: version.reason, label: version.label, title: '', created: version.created,
      body: (version.body ?? undefined) as unknown as JSONNode | undefined,
    })),
    files: state.files,
    blocks: state.blocks,
  };
}

/**
 * A body the server keeps in its shared body module (module/projects/richbody) behind an owner's address (base, such as
 * /api/v1/workspace/projects/{key}/issues/{number}/body): read and saved there (409 when another save came first), and its kept
 * versions restored as a new version. The discussion is the owner's timeline, not the body's (결정기록 2026-11-04 공통
 * 활동). canWrite false reads the body but changes nothing.
 */
export const bodyStateOptions = (base: string, readerId: string) => queryOptions({
  queryKey: [base.includes('/issues/') ? 'workItems' : 'documents', 'body', readerId, base],
  queryFn: ({ signal }) => getJson<BodyState>(base, signal),
  staleTime: 3000,
});

export function serverBodyStore({ base, client, readerId }: { base: string; author?: string; canWrite?: boolean; client?: QueryClient; readerId?: string }): RichBodyStore {
  const keep = (state: BodyState) => {
    if (client && readerId) client.setQueryData(bodyStateOptions(base, readerId).queryKey, state);
    return snapshotOf(state);
  };
  const state = client && readerId ? client.getQueryState<BodyState>(bodyStateOptions(base, readerId).queryKey) : undefined;
  // 캐시가 있으면 나이와 상관없이 첫 그림에 쓰고(기다리지 않는다), 3초가 지났거나 무효로 표시된 것이면 본문이 뒤에서 확인한다.
  const initial = state?.data ? snapshotOf(state.data) : undefined;
  return {
    initialSnapshot: initial,
    isInitialStale: !!state?.data && (state.isInvalidated || Date.now() - state.dataUpdatedAt >= 3000),
    editing: readerId ? {
      key: [base.includes('/issues/') ? 'workItems' : 'documents', 'editing', readerId, base],
      read: async () => (await getJson<BodyEditor[]>(`${base}/editing`)).filter(editor => editor.userId !== readerId),
      keep: lease => sendCommand(`${base}/editing/${lease}`, 'PUT'),
      leave: lease => sendCommand(`${base}/editing/${lease}`, 'DELETE'),
    } : undefined,
    load: async () => snapshotOf(await (client && readerId ? client.query(bodyStateOptions(base, readerId)) : getJson<BodyState>(base))),
    save: async ({ expectedVersion, body, uploadIds, checkpoint }) =>
      keep(await sendJson<BodyState>(base, 'PUT', { expectedVersion, body, uploadIds, checkpoint, schemaVersion: 1 })),
    patch: async patch => keep(await sendJson<BodyState>(base, 'PATCH', patch)),
    history: {
      read: async versionId =>
        ((await getJson<components['schemas']['RichBodyVersion']>(`${base}/versions/${encodeURIComponent(versionId)}`)).body ?? null) as JSONNode | null,
      restore: async (versionId, expectedVersion) =>
        keep(await sendJson<BodyState>(`${base}/revisions/${encodeURIComponent(versionId)}/restore`, 'POST', { expectedVersion })),
    },
  };
}
