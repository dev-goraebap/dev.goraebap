import type { Issue, IssueApi, IssuePatch, NewIssue } from '../entities/issue';
import { me } from '../entities/issue';
import { seedIssues } from './seed';

/** 메모리에만 저장하는 모의 저장소. 견본마다 새로 만들며 실제 서버·계정을 바꾸지 않는다. */
export function createIssueApi({ delay = 180, fail = false, initial = seedIssues }: { delay?: number; fail?: boolean; initial?: Issue[] } = {}): IssueApi {
  let items = structuredClone(initial);
  const wait = async (signal?: AbortSignal) => {
    signal?.throwIfAborted();
    await new Promise<void>((resolve, reject) => {
      const abort = () => { clearTimeout(timer); reject(signal?.reason); };
      const timer = setTimeout(() => { signal?.removeEventListener('abort', abort); resolve(); }, delay);
      signal?.addEventListener('abort', abort, { once: true });
    });
    if (fail) throw new Error('이슈를 불러오지 못했습니다.');
  };
  const missing = () => Object.assign(new Error('이슈를 찾을 수 없습니다.'), { status: 404 });
  const change = (id: string, patch: Partial<Issue>) => {
    const current = items.find(each => each.id === id);
    if (!current) throw missing();
    const next = { ...current, ...patch, updatedAt: new Date().toISOString() };
    items = items.map(each => (each.id === id ? next : each));
    return structuredClone(next);
  };
  return {
    async list(signal) { await wait(signal); return structuredClone(items); },
    async get(id, signal) {
      await wait(signal);
      const item = items.find(each => each.id === id);
      if (!item) throw missing();
      return structuredClone(item);
    },
    async create(input: NewIssue) {
      await wait();
      const number = Math.max(0, ...items.map(each => Number(each.id.slice(4)))) + 1;
      const now = new Date().toISOString();
      const issue: Issue = { ...input, id: `ISS-${number}`, author: me, createdAt: now, updatedAt: now, comments: [] };
      items = [issue, ...items];
      return structuredClone(issue);
    },
    async update(id, patch: IssuePatch) { await wait(); return change(id, patch); },
    async comment(id, text) {
      await wait();
      const current = items.find(each => each.id === id);
      if (!current) throw missing();
      return change(id, { comments: [...current.comments, { id: crypto.randomUUID(), author: me, text, at: new Date().toISOString() }] });
    },
  };
}
