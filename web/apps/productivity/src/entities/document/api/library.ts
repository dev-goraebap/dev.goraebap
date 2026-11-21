import { queryOptions } from '@tanstack/react-query';
import { getJson, sendCommand, sendCreate } from '@/shared/api';
import type { DocumentRow } from './documents';

export type DocumentLabel = {
  id: string;
  name: string;
  color: string;
  position: number;
  version: number;
  uses: number;
};
export type DocumentLayout = 'LIST' | 'GRID';
export type LibrarySort = 'CUSTOM' | 'TITLE' | 'UPDATED' | 'CREATED';
export type DocumentSavedView = {
  id: string;
  name: string;
  labels: string[];
  icon: string | null;
  color: string | null;
  layout: DocumentLayout;
  sort: LibrarySort;
  direction: 'ASC' | 'DESC';
  version: number;
};
export type DocumentLibrary = {
  labels: DocumentLabel[];
  assignments: Record<string, string[]>;
  views: DocumentSavedView[];
  pages: DocumentRow[];
  order: { ids: string[]; version: number };
  canManage: boolean;
};
const base = (key: string) => `/api/v1/workspace/projects/${encodeURIComponent(key)}/document-library`;
export const libraryOptions = (key: string) =>
  queryOptions({
    queryKey: ['documents', 'library', key.toUpperCase()],
    queryFn: ({ signal }) => getJson<DocumentLibrary>(base(key), signal),
  });
export const saveDocumentLabels = (key: string, id: string, expectedVersion: number, ids: string[]) =>
  sendCommand(`${base(key)}/documents/${id}/labels`, 'PUT', {
    expectedVersion,
    ids,
  });
export const documentLabelsOptions = () =>
  queryOptions({
    queryKey: ['documents', 'labels'],
    queryFn: ({ signal }) => getJson<DocumentLabel[]>('/api/v1/workspace/document-labels', signal),
  });
export const createDocumentLabel = async (value: { name: string; color: string }) =>
  (await sendCreate('/api/v1/workspace/document-labels', value)).split('/').pop()!;
export const editDocumentLabel = (label: DocumentLabel, value: { name: string; color: string }) =>
  sendCommand(`/api/v1/workspace/document-labels/${label.id}`, 'PATCH', { ...value, expectedVersion: label.version });
export const deleteDocumentLabel = (label: DocumentLabel) =>
  sendCommand(`/api/v1/workspace/document-labels/${label.id}?expectedVersion=${label.version}`, 'DELETE');
export const orderDocumentLabels = (ids: string[]) => sendCommand('/api/v1/workspace/document-labels/order', 'PUT', { ids });
export const saveDocumentView = (
  key: string,
  value: Omit<DocumentSavedView, 'id' | 'version'>,
  existing?: DocumentSavedView,
) =>
  existing
    ? sendCommand(`${base(key)}/views/${existing.id}`, 'PUT', {
        ...value,
        expectedVersion: existing.version,
      })
    : sendCreate(`${base(key)}/views`, value).then((location) => location.split('/').pop()!);
export const orderDocumentViews = (key: string, ids: string[]) => sendCommand(`${base(key)}/views/order`, 'PUT', { ids });
export const deleteDocumentView = (key: string, id: string, version: number) =>
  sendCommand(`${base(key)}/views/${id}?expectedVersion=${version}`, 'DELETE');
export const saveDocumentOrder = (key: string, ids: string[], expectedVersion: number, parentId: string | null = null) =>
  sendCommand(`${base(key)}/order`, 'PUT', { ids, expectedVersion, parentId });
export const moveDocumentPage = (key: string, document: DocumentRow, parentId: string | null) =>
  sendCommand(`${base(key)}/documents/${document.id}/parent`, 'PUT', { expectedVersion: document.version, parentId });

/**
 * 본문의 링크 입력 칸에서 이름으로 찾아 걸 문서들(문서 언급): 프로젝트 문서함의 문서와 하위 페이지를 이름, 앱 안의 주소,
 * 그리고 하위 페이지면 맨 위 문서의 이름(hint)으로 낸다. except는 자기 자신처럼 뺄 문서다.
 */
export function documentLinks(pages: DocumentRow[], except?: string): { title: string; href: string; hint?: string }[] {
  const byId = new Map(pages.map(page => [page.id, page]));
  const rootOf = (page: DocumentRow) => { let at = page; const seen = new Set<string>(); while (at.parentId && byId.has(at.parentId) && !seen.has(at.id)) { seen.add(at.id); at = byId.get(at.parentId)!; } return at; };
  return pages.filter(page => page.id !== except && page.projectKey).map(page => {
    const root = rootOf(page);
    return { title: page.title, href: `/workspace/projects/${page.projectKey}/documents/${page.id}`, hint: root.id === page.id ? undefined : root.title };
  });
}
