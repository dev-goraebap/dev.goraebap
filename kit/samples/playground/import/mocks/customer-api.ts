import type { Customer, CustomerApi } from '../entities/customer';

export const seedCustomers: Customer[] = [
  { id: 'c1', name: '민서', email: 'minseo@example.com', phone: '010-2222-0101', joinedAt: '2025-11-02', tier: '우수' },
  { id: 'c2', name: '준호', email: 'junho@example.com', phone: '010-2222-0102', joinedAt: '2025-12-14', tier: '일반' },
  { id: 'c3', name: '지민', email: 'jimin@example.com', joinedAt: '2026-01-05', tier: '일반' },
];

/** 메모리에만 저장하는 모의 저장소. failAt은 그 번째 행에서 가져오기가 실패하게 한다. */
export function createCustomerApi({ delay = 90, fail = false, failAt, initial = seedCustomers }: {
  delay?: number; fail?: boolean; failAt?: number; initial?: Customer[];
} = {}): CustomerApi {
  let items = structuredClone(initial);
  const wait = (ms = delay) => new Promise<void>(resolve => setTimeout(resolve, ms));
  return {
    async list(signal) {
      signal?.throwIfAborted();
      await wait();
      if (fail) throw new Error('고객을 불러오지 못했습니다.');
      return structuredClone(items);
    },
    async importRows(rows, onProgress) {
      let done = 0;
      for (const row of rows) {
        await wait(60);
        if (failAt !== undefined && done + 1 === failAt) throw new Error('가져오기를 이어 갈 수 없습니다.');
        items = [...items, { ...row, id: crypto.randomUUID() }];
        done += 1;
        onProgress(done);
      }
      return { imported: done };
    },
  };
}
