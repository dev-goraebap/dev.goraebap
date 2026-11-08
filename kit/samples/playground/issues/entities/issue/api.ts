import { queryOptions } from '@tanstack/react-query';
import { createContext, useContext } from 'react';
import type { Issue, IssuePatch, NewIssue } from './model';

export interface IssueApi {
  list(signal?: AbortSignal): Promise<Issue[]>;
  get(id: string, signal?: AbortSignal): Promise<Issue>;
  create(input: NewIssue): Promise<Issue>;
  update(id: string, patch: IssuePatch): Promise<Issue>;
  comment(id: string, text: string, parentId?: string): Promise<Issue>;
  remove(id:string):Promise<void>;
  editComment(id: string, commentId: string, text?: string): Promise<Issue>;
}

export const IssueApiContext = createContext<IssueApi | null>(null);
export function useIssueApi() {
  const api = useContext(IssueApiContext);
  if (!api) throw new Error('IssueApiContext가 필요합니다.');
  return api;
}

/** 조회를 소유한 슬라이스에 키·요청·옵션을 함께 둔다. 응답을 바꾸는 인자는 모두 키에 넣는다. */
export const issueKeys = { all: ['issues'] as const, detail: (id: string) => ['issues', id] as const };
export const issueQueries = {
  all: (api: IssueApi) => queryOptions({ queryKey: issueKeys.all, queryFn: ({ signal }) => api.list(signal), staleTime: 30_000 }),
  detail: (api: IssueApi, id: string) => queryOptions({ queryKey: issueKeys.detail(id), queryFn: ({ signal }) => api.get(id, signal), staleTime: 30_000 }),
};
