import { queryOptions } from '@tanstack/react-query';
import { createContext, useContext } from 'react';
import type { Approval, DecisionResult, NewApproval } from './model';

export interface ApprovalApi {
  list(signal?: AbortSignal): Promise<Approval[]>;
  get(id: string, signal?: AbortSignal): Promise<Approval>;
  create(input: NewApproval): Promise<Approval>;
  /** 지금 차례인 결재자의 결정. 이미 처리되었거나 차례가 아니면 409. */
  decide(id: string, approver: string, result: DecisionResult, opinion?: string): Promise<Approval>;
}

export const ApprovalApiContext = createContext<ApprovalApi | null>(null);
export function useApprovalApi() {
  const api = useContext(ApprovalApiContext);
  if (!api) throw new Error('ApprovalApiContext가 필요합니다.');
  return api;
}

/** 조회를 소유한 슬라이스에 키·요청·옵션을 함께 둔다. 응답을 바꾸는 인자는 모두 키에 넣는다. */
export const approvalKeys = { all: ['approvals'] as const, detail: (id: string) => ['approvals', id] as const };
export const approvalQueries = {
  all: (api: ApprovalApi) => queryOptions({ queryKey: approvalKeys.all, queryFn: ({ signal }) => api.list(signal), staleTime: 30_000 }),
  detail: (api: ApprovalApi, id: string) => queryOptions({ queryKey: approvalKeys.detail(id), queryFn: ({ signal }) => api.get(id, signal), staleTime: 30_000 }),
};
