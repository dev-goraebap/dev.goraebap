import { queryOptions } from '@tanstack/react-query';
import { createContext, useContext } from 'react';

export type Customer = { id: string; name: string; email: string; phone?: string; joinedAt?: string; tier?: string };
export type CustomerInput = Omit<Customer, 'id'>;

/** 가져오기가 채우는 항목. 이름과 이메일은 꼭 있어야 한다. */
export const fields = [
  { id: 'name', label: '이름', isRequired: true },
  { id: 'email', label: '이메일', isRequired: true },
  { id: 'phone', label: '전화번호', isRequired: false },
  { id: 'joinedAt', label: '가입일', isRequired: false },
  { id: 'tier', label: '등급', isRequired: false },
] as const;
export type FieldId = (typeof fields)[number]['id'];

export interface CustomerApi {
  list(signal?: AbortSignal): Promise<Customer[]>;
  /** 행을 차례로 저장한다. 저장한 수를 onProgress로 알린다. */
  importRows(rows: CustomerInput[], onProgress: (done: number) => void): Promise<{ imported: number }>;
}

export const CustomerApiContext = createContext<CustomerApi | null>(null);
export function useCustomerApi() {
  const api = useContext(CustomerApiContext);
  if (!api) throw new Error('CustomerApiContext가 필요합니다.');
  return api;
}

export const customerKeys = { all: ['customers'] as const };
export const customerQueries = {
  all: (api: CustomerApi) => queryOptions({ queryKey: customerKeys.all, queryFn: ({ signal }) => api.list(signal), staleTime: 30_000 }),
};
