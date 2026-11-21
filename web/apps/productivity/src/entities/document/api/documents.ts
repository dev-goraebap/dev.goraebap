import { infiniteQueryOptions, keepPreviousData, queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { getJson, sendCommand, type components } from '@/shared/api';

/*
 * Documents' and their folders' reads and writes against /api/v1/workspace/documents and /api/v1/workspace/document-folders, as client/'s. A
 * document lives in a space: a project's (its key, current or old) or the shared one (공용, no key). Every read sits
 * under ['documents'], so a change made here reads them again.
 */

type Schemas = components['schemas'];
type Required<T, K extends keyof T> = T & { [P in K]-?: NonNullable<T[P]> };

/** A document as lists show it: its space, folder, title, the first words of its body, its maker and last writer. */
export type DocumentRow = Required<Schemas['DocumentRow'], 'id' | 'title' | 'createdAt' | 'updatedAt' | 'version'>;
export type DocumentSlice = { items: DocumentRow[]; nextCursor?: string };
export type FolderStep = Required<Schemas['FolderStep'], 'id' | 'name'>;
/** A document opened: its row, the folders down to it, and whether the reader may change and delete it. */
export type DocumentView = { document: DocumentRow; path: FolderStep[]; canWrite: boolean; canDelete: boolean; canManage: boolean };
/** How a list runs: by the last writing (newest first), by making, or by title. */
export type DocumentSort = 'UPDATED' | 'CREATED' | 'TITLE';
/**
 * What a list reads: one project's space; one folder's own documents (folderId) or those at the space's top (top); words
 * in the title or the body (across the space, folders aside); and the order.
 */
export type DocumentListing = { project?: string; shared?: boolean; folderId?: string; top?: boolean; q?: string; sort?: DocumentSort; direction?: 'ASC' | 'DESC' };

export const PAGE_SIZE = 50;
const BASE = '/api/v1/workspace/documents';
export const documentPath = (id: string) => `${BASE}/${encodeURIComponent(id)}`;

export const documentKeys = {
  all: ['documents'] as const,
  list: (listing: DocumentListing) => ['documents', 'list', listing] as const,
  document: (id: string) => ['documents', 'document', id] as const,
};

/** Documents a slice at a time; every condition goes into the key, so other conditions start the list over. */
export const documentsOptions = (listing: DocumentListing) => infiniteQueryOptions({
  queryKey: documentKeys.list(listing),
  queryFn: ({ pageParam, signal }) => {
    const params = new URLSearchParams({ size: String(PAGE_SIZE) });
    for (const [name, value] of Object.entries(listing)) if (value !== undefined && value !== false && value !== '') params.set(name, String(value));
    if (pageParam) params.set('cursor', pageParam);
    return getJson<DocumentSlice>(`${BASE}?${params}`, signal);
  },
  initialPageParam: undefined as string | undefined,
  getNextPageParam: last => last.nextCursor ?? undefined,
  placeholderData: keepPreviousData,
});

/** One document by its id; a missing one fails as not found. */
export const documentOptions = (id: string) => queryOptions({
  queryKey: documentKeys.document(id),
  queryFn: ({ signal }) => getJson<DocumentView>(documentPath(id), signal),
});

/** Whether a query key reads the document of this id (its own key, or an address with the id in it). */
const reads = (key: readonly unknown[], id: string) => key.some(part => part === id || (typeof part === 'string' && part.includes(`/${id}`)));

/**
 * A command on documents or folders; every document read is read again once it is through. A command that takes a
 * document away (gone) waits for onDone (the screen leaving it), then drops that document's own reads instead: read
 * again, by this or by the server's signal, they would only answer 404.
 */
function useDocumentsCommand<T, R>(send: (input: T) => Promise<R>, onDone?: (result: R) => unknown, gone?: (input: T) => string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: send,
    onSuccess: async (result, input) => {
      await onDone?.(result);
      const id = gone?.(input);
      if (id) client.removeQueries({ queryKey: documentKeys.all, predicate: query => reads(query.queryKey, id) });
    },
    onSettled: () => client.invalidateQueries({ queryKey: documentKeys.all }),
  });
}

export const useRenameDocument = (onDone?: () => void) => useDocumentsCommand(({ document, title }: { document: DocumentRow; title: string }) =>
  sendCommand(documentPath(document.id), 'PATCH', { expectedVersion: document.version, title: title.trim() }), onDone);

export const useDeleteDocument = (onDone?: () => unknown) => useDocumentsCommand(({ document }: { document: DocumentRow }) =>
  sendCommand(`${documentPath(document.id)}?expectedVersion=${document.version}`, 'DELETE'), onDone, ({ document }) => document.id);
