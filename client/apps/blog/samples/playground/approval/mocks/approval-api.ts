import { currentOf, me, type Approval, type ApprovalApi, type NewApproval } from '../entities/approval';
import { seedApprovals } from './seed';

/** 메모리에만 저장하는 모의 저장소. 견본마다 새로 만들며 실제 서버·계정을 바꾸지 않는다. */
export function createApprovalApi({ delay = 180, fail = false, initial = seedApprovals }: { delay?: number; fail?: boolean; initial?: Approval[] } = {}): ApprovalApi {
  let items = structuredClone(initial);
  const wait = async (signal?: AbortSignal) => {
    signal?.throwIfAborted();
    await new Promise<void>((resolve, reject) => {
      const abort = () => { clearTimeout(timer); reject(signal?.reason); };
      const timer = setTimeout(() => { signal?.removeEventListener('abort', abort); resolve(); }, delay);
      signal?.addEventListener('abort', abort, { once: true });
    });
    if (fail) throw new Error('결재 문서를 불러오지 못했습니다.');
  };
  const missing = () => Object.assign(new Error('결재 문서를 찾을 수 없습니다.'), { status: 404 });
  return {
    async list(signal) { await wait(signal); return structuredClone(items); },
    async get(id, signal) {
      await wait(signal);
      const item = items.find(each => each.id === id);
      if (!item) throw missing();
      return structuredClone(item);
    },
    async create(input: NewApproval) {
      await wait();
      const number = Math.max(0, ...items.map(each => Number(each.id.slice(3)))) + 1;
      const approval: Approval = { ...input, id: `AP-${number}`, applicant: me, createdAt: new Date().toISOString(),
        line: input.line.map(each => ({ ...each, state: 'pending' as const })) };
      items = [approval, ...items];
      return structuredClone(approval);
    },
    async decide(id, approver, result, opinion) {
      await wait();
      const current = items.find(each => each.id === id);
      if (!current) throw missing();
      if (currentOf(current)?.approver !== approver) throw Object.assign(new Error('이미 처리되었거나 차례가 아닙니다.'), { status: 409 });
      const next: Approval = { ...current, line: current.line.map(each => each.approver === approver
        ? { ...each, state: result, at: new Date().toISOString(), opinion: opinion?.trim() || undefined } : each) };
      items = items.map(each => (each.id === id ? next : each));
      return structuredClone(next);
    },
  };
}
