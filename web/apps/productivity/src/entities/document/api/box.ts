import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import type { JSONNode } from '@/shared/lib/rich-document';
import { getJson, sendCommand, sendCreate, type components } from '@/shared/api';
import { documentKeys, documentPath, type DocumentRow } from './documents';

/*
 * 문서함's own reads and writes beside the documents' and folders' (docs/pending-records.md, 문서함): every project's
 * folder at the top, a document's or folder's mark, a 매뉴얼's chapters and their bodies, and the permissions of a folder
 * or document. Every read sits under ['documents'], so a change made here reads them all again.
 */

type Schemas = components['schemas'];
type Required<T, K extends keyof T> = T & { [P in K]-?: NonNullable<T[P]> };

/** How far one may go with a folder or document. */
export type AccessLevel = 'NONE' | 'READ' | 'WRITE' | 'MANAGE';
/** Who a grant is for: the item's maker, a member or a project's members. */
export type GrantSubject = 'OWNER' | 'USER' | 'PROJECT';
export type Grant = { subject: GrantSubject; subjectId?: string; name?: string; level: Exclude<AccessLevel, 'NONE'> };
/** A folder's or document's permissions: its own grants, the closed folders above it, the reader's level and say. */
export type Access = {
  grants: Grant[]; inherited: { folderId: string; folderName: string; grants: Grant[] }[]; level: AccessLevel; canManage: boolean;
};
export type Mark = { icon: string | null; color: string | null };
const idOf = (location: string) => location.split('/').pop() ?? '';

export const boxKeys = {
  projects: ['documents', 'box', 'projects'] as const,
  chapters: (documentId: string) => ['documents', 'chapters', documentId] as const,
  access: (target: 'documents' | 'document-folders', id: string) => ['documents', 'access', target, id] as const,
};

/** A folder's or document's permissions. */
export const accessOptions = (target: 'documents' | 'document-folders', id: string) => queryOptions({
  queryKey: boxKeys.access(target, id),
  queryFn: ({ signal }) => getJson<Access>(`/api/v1/workspace/${target}/${encodeURIComponent(id)}/access`, signal),
});

function useBoxCommand<T, R>(send: (input: T) => Promise<R>, onDone?: (result: R) => void) {
  const client = useQueryClient();
  return useMutation({ mutationFn: send, onSuccess: result => onDone?.(result), onSettled: () => client.invalidateQueries({ queryKey: documentKeys.all }) });
}

/** A new document of a kind, marked, with its first body (a 매뉴얼's cover); its id comes back. */
export type NewBoxDocument = { projectKey: string; parentId?: string; kind: 'PAGE'; title: string; mark: Mark; body?: JSONNode; uploadIds?: string[]; labelIds?: string[] };
export const useCreateBoxDocument = (onDone?: (id: string) => void) => useBoxCommand(async (input: NewBoxDocument) => idOf(await sendCreate('/api/v1/workspace/documents', {
  projectKey: input.projectKey, parentId: input.parentId, kind: input.kind, title: input.title.trim(),
  icon: input.mark.icon ?? undefined, color: input.mark.color ?? undefined, body: input.body, uploadIds: input.uploadIds, labelIds: input.labelIds,
})), onDone);

/** A document's own icon and colour. */
export const useMark = (onDone?: () => void) => useBoxCommand((change: { document: DocumentRow; mark: Mark }) =>
  sendCommand(`${documentPath(change.document.id)}/mark`, 'PUT', { expectedVersion: change.document.version, ...markBody(change.mark) }), onDone);
const markBody = (mark: Mark) => ({ icon: mark.icon ?? undefined, color: mark.color ?? undefined });

/** A folder's or document's grants in place of what it had; none opens it. */
export const useReplaceAccess = (onDone?: () => void) => useBoxCommand(({ target, id, grants }: { target: 'documents' | 'document-folders'; id: string; grants: Grant[] }) =>
  sendCommand(`/api/v1/workspace/${target}/${encodeURIComponent(id)}/access`, 'PUT', {
    grants: grants.map(grant => ({ subject: grant.subject, subjectId: grant.subjectId, level: grant.level })),
  }), onDone);

/** What a document's or a chapter's timeline is under: the document's address or the chapter's. */
export type BodyTarget = 'documents' | 'manual-chapters';
/** One entry of a document's or chapter's 활동: a comment (its text and the words it quotes) or a change (BODY). */
export type BodyActivityEntry = Required<Schemas['BodyActivityEntry'], 'kind' | 'id' | 'at'>;

/** A document's or a chapter's 활동, oldest first. */
export const bodyActivityOptions = (target: BodyTarget, id: string) => queryOptions({
  queryKey: ['documents', 'activity', target, id] as const,
  queryFn: ({ signal }) => getJson<BodyActivityEntry[]>(`/api/v1/workspace/${target}/${encodeURIComponent(id)}/timeline`, signal),
});

/** A comment written (quoting words of the body it was written on), changed or deleted on a document's or chapter's 활동. */
export function changeBodyComment(target: BodyTarget, id: string, change: { commentId?: string; text?: string; quote?: string; parentId?: string; blockId?: string; isDeleting?: boolean }): Promise<void> {
  const base = `/api/v1/workspace/${target}/${encodeURIComponent(id)}/comments`;
  if (change.isDeleting && change.commentId) return sendCommand(`${base}/${change.commentId}`, 'DELETE');
  if (change.commentId) return sendCommand(`${base}/${change.commentId}`, 'PATCH', { body: change.text });
  return sendCreate(base, { body: change.text, quote: change.quote, parentId: change.parentId, blockId: change.blockId }).then(() => undefined);
}

/** A thread on a document's or chapter's 활동 resolved, or opened again. */
export function resolveBodyComment(target: BodyTarget, id: string, commentId: string, resolved: boolean): Promise<void> {
  return sendCommand(`/api/v1/workspace/${target}/${encodeURIComponent(id)}/comments/${commentId}/resolution`, 'PUT', { resolved });
}
