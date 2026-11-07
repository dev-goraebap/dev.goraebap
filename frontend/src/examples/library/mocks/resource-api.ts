import type { NewResource, Resource, ResourceApi } from "../entities/resource";
import { seedResources } from "./seed";
export function createResourceApi({
  storage,
  delay = 180,
  fail = false,
  initial = seedResources,
}: {
  storage?: Storage;
  delay?: number;
  fail?: boolean;
  initial?: Resource[];
} = {}): ResourceApi {
  const key = "goraebap-library-v1";
  let items = structuredClone(initial);
  try {
    const saved = storage?.getItem(key);
    if (saved) items = JSON.parse(saved);
  } catch {
    /* 저장 데이터를 읽지 못하면 초기값을 사용한다. */
  }
  const wait = async (signal?: AbortSignal) => {
    signal?.throwIfAborted();
    await new Promise<void>((resolve, reject) => {
      const abort = () => {
        clearTimeout(timer);
        reject(signal?.reason);
      };
      const timer = setTimeout(() => {
        signal?.removeEventListener("abort", abort);
        resolve();
      }, delay);
      signal?.addEventListener("abort", abort, { once: true });
    });
    if (fail)
      throw new Error("자료를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.");
  };
  const commit = (next: Resource[]) => {
    storage?.setItem(key, JSON.stringify(next));
    items = next;
  };
  return {
    async list(signal) {
      await wait(signal);
      return structuredClone(items);
    },
    async get(id, signal) {
      await wait(signal);
      const item = items.find((item) => item.id === id);
      if (!item) throw new Error("자료를 찾을 수 없습니다.");
      return structuredClone(item);
    },
    async create(input: NewResource) {
      await wait();
      const resource: Resource = {
        ...input,
        id: crypto.randomUUID(),
        author: "서윤",
        updatedAt: new Date().toISOString(),
        starred: false,
      };
      commit([resource, ...items]);
      return resource;
    },
    async update(id, patch) {
      await wait();
      const current = items.find((item) => item.id === id);
      if (!current) throw new Error("자료를 찾을 수 없습니다.");
      const next = { ...current, ...patch };
      commit(items.map((item) => (item.id === id ? next : item)));
      return next;
    },
  };
}
