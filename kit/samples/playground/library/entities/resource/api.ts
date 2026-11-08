import { queryOptions } from '@tanstack/react-query';
import { createContext, useContext } from 'react';
import type { NewResource, Resource } from './model';

export interface ResourceApi {
  list(signal?: AbortSignal): Promise<Resource[]>;
  get(id: string, signal?: AbortSignal): Promise<Resource>;
  create(input: NewResource): Promise<Resource>;
  update(id: string, patch: Partial<Omit<Resource, 'id' | 'author' | 'updatedAt'>>): Promise<Resource>;
  remove(id: string): Promise<void>;
}

export const ResourceApiContext = createContext<ResourceApi | null>(null);
export function useResourceApi() {
  const api = useContext(ResourceApiContext);
  if (!api) throw new Error('ResourceApiContext가 필요합니다.');
  return api;
}

/** 조회를 소유한 슬라이스에 키·요청·옵션을 함께 둔다. 응답을 바꾸는 인자는 모두 키에 넣는다. */
export const resourceKeys = { all: ['resources'] as const, detail: (id: string) => ['resources', id] as const };
export const resourceQueries = {
  all: (api: ResourceApi) => queryOptions({ queryKey: resourceKeys.all, queryFn: ({ signal }) => api.list(signal), staleTime: 30_000 }),
  detail: (api: ResourceApi, id: string) => queryOptions({ queryKey: resourceKeys.detail(id), queryFn: ({ signal }) => api.get(id, signal), staleTime: 30_000 }),
};
