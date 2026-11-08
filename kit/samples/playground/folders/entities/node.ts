import { queryOptions } from '@tanstack/react-query';
import { createContext, useContext } from 'react';

/** 폴더 또는 파일. 모든 노드는 평평한 목록에 있고 parentId로 이어진다. 최상위 폴더(ROOT)만 부모가 없다. */
export type FolderNode = {
  id: string; parentId: string | null; name: string; kind: 'folder' | 'file';
  /** 파일 종류. 아이콘을 고른다. */
  type?: 'document' | 'image';
  size?: number; updatedAt: string;
};

export const ROOT = 'root';

export interface FolderApi {
  list(signal?: AbortSignal): Promise<FolderNode[]>;
  createFolder(parentId: string, name: string): Promise<FolderNode>;
  rename(id: string, name: string): Promise<FolderNode>;
  move(id: string, parentId: string): Promise<FolderNode>;
}

export const FolderApiContext = createContext<FolderApi | null>(null);
export function useFolderApi() {
  const api = useContext(FolderApiContext);
  if (!api) throw new Error('FolderApiContext가 필요합니다.');
  return api;
}

export const nodeKeys = { all: ['nodes'] as const };
export const nodeQueries = {
  all: (api: FolderApi) => queryOptions({ queryKey: nodeKeys.all, queryFn: ({ signal }) => api.list(signal), staleTime: 30_000 }),
};

/** 한 폴더의 내용: 폴더가 먼저, 같은 종류끼리 이름 순. */
export const childrenOf = (nodes: FolderNode[], parentId: string) => nodes.filter(node => node.parentId === parentId)
  .sort((a, b) => (a.kind === b.kind ? a.name.localeCompare(b.name, 'ko') : a.kind === 'folder' ? -1 : 1));

/** 루트부터 이 폴더까지의 폴더들. 머리 줄 경로가 된다. */
export function pathTo(nodes: FolderNode[], id: string) {
  const path: FolderNode[] = [];
  for (let node = nodes.find(each => each.id === id); node; node = node.parentId ? nodes.find(each => each.id === node!.parentId) : undefined) path.unshift(node);
  return path;
}

export function descendantIds(nodes: FolderNode[], id: string): Set<string> {
  const found = new Set<string>();
  const visit = (parent: string) => nodes.filter(node => node.parentId === parent).forEach(node => { found.add(node.id); visit(node.id); });
  visit(id);
  return found;
}

/** 옮길 수 있는 곳인지: 폴더이고, 지금 있는 곳이 아니며, 자기 자신이나 자기 안쪽이 아니고, 같은 이름이 없다. */
export function canMove(nodes: FolderNode[], id: string, targetId: string) {
  const node = nodes.find(each => each.id === id);
  const target = nodes.find(each => each.id === targetId);
  if (!node || !target || target.kind !== 'folder' || node.parentId === targetId || id === targetId) return false;
  if (node.kind === 'folder' && descendantIds(nodes, id).has(targetId)) return false;
  return !nodes.some(each => each.parentId === targetId && each.name === node.name);
}

export const hasName = (nodes: FolderNode[], parentId: string, name: string, exceptId?: string) =>
  nodes.some(node => node.parentId === parentId && node.id !== exceptId && node.name === name.trim());

export const folderHref = (id: string) => (id === ROOT ? '/folders' : `/folders/${id}`);

export const sizeText = (bytes?: number) => bytes == null ? '' : bytes >= 1024 ** 2 ? `${(bytes / 1024 ** 2).toFixed(1)}MB` : `${Math.max(1, Math.round(bytes / 1024))}KB`;
