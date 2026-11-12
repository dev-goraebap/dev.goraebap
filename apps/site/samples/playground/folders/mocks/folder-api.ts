import { canMove, type FolderApi, type FolderNode } from '../entities/node';
import { seedNodes } from './seed';

const TODAY = '2026-11-08';

/** 메모리에만 저장하는 모의 저장소. 견본마다 새로 만들며 실제 파일을 바꾸지 않는다. */
export function createFolderApi({ delay = 120, fail = false, initial = seedNodes }: { delay?: number; fail?: boolean; initial?: FolderNode[] } = {}): FolderApi {
  let items = structuredClone(initial);
  const wait = async (signal?: AbortSignal) => {
    signal?.throwIfAborted();
    await new Promise<void>((resolve, reject) => {
      const abort = () => { clearTimeout(timer); reject(signal?.reason); };
      const timer = setTimeout(() => { signal?.removeEventListener('abort', abort); resolve(); }, delay);
      signal?.addEventListener('abort', abort, { once: true });
    });
    if (fail) throw new Error('폴더를 불러오지 못했습니다.');
  };
  const replace = (id: string, patch: Partial<FolderNode>) => {
    const current = items.find(each => each.id === id);
    if (!current) throw new Error('찾을 수 없습니다.');
    const next = { ...current, ...patch, updatedAt: TODAY };
    items = items.map(each => (each.id === id ? next : each));
    return next;
  };
  return {
    async list(signal) { await wait(signal); return structuredClone(items); },
    async createFolder(parentId, name) {
      await wait();
      const node: FolderNode = { id: crypto.randomUUID(), parentId, name: name.trim(), kind: 'folder', updatedAt: TODAY };
      items = [...items, node];
      return node;
    },
    async rename(id, name) { await wait(); return replace(id, { name: name.trim() }); },
    async move(id, parentId) {
      await wait();
      if (!canMove(items, id, parentId)) throw new Error('그곳으로 옮길 수 없습니다.');
      return replace(id, { parentId });
    },
  };
}
