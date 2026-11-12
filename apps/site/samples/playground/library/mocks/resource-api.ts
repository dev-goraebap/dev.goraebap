import type { NewResource, Resource, ResourceApi } from '../entities/resource';
import { seedResources } from './seed';

/** 메모리에만 저장하는 모의 저장소. Story마다 새로 만들며 실제 서버·계정을 바꾸지 않는다. */
export function createResourceApi({ delay = 180, fail = false, initial = seedResources }: {
  delay?: number; fail?: boolean; initial?: Resource[];
} = {}): ResourceApi {
  let items = structuredClone(initial);
  const wait = async (signal?: AbortSignal) => {
    signal?.throwIfAborted();
    await new Promise<void>((resolve, reject) => {
      const abort = () => { clearTimeout(timer); reject(signal?.reason); };
      const timer = setTimeout(() => { signal?.removeEventListener('abort', abort); resolve(); }, delay);
      signal?.addEventListener('abort', abort, { once: true });
    });
    if (fail) throw new Error('자료를 불러오지 못했습니다.');
  };
  const missing = () => Object.assign(new Error('자료를 찾을 수 없습니다.'), { status: 404 });
  return {
    async list(signal) { await wait(signal); return structuredClone(items); },
    async get(id, signal) {
      await wait(signal);
      const item = items.find(each => each.id === id);
      if (!item) throw missing();
      return structuredClone(item);
    },
    async create(input: NewResource) {
      await wait();
      const resource: Resource = { ...input, summary: '', id: crypto.randomUUID(), author: '서윤', updatedAt: new Date().toISOString(), starred: false };
      items = [resource, ...items];
      return resource;
    },
    async update(id, patch) {
      await wait();
      const current = items.find(each => each.id === id);
      if (!current) throw missing();
      const next = { ...current, ...patch, updatedAt: new Date().toISOString() };
      items = items.map(each => (each.id === id ? next : each));
      return next;
    },
    async remove(id) { await wait(); items = items.filter(each => each.id !== id); },
  };
}
