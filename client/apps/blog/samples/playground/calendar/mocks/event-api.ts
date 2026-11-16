import type { CalendarEvent, EventApi } from '../entities/event';
import { seedEvents } from './seed';

/** 메모리에만 저장하는 모의 저장소. 견본마다 새로 만들며 실제 일정을 바꾸지 않는다. */
export function createEventApi({ delay = 120, fail = false, initial = seedEvents }: { delay?: number; fail?: boolean; initial?: CalendarEvent[] } = {}): EventApi {
  let items = structuredClone(initial);
  const wait = async (signal?: AbortSignal) => {
    signal?.throwIfAborted();
    await new Promise<void>((resolve, reject) => {
      const abort = () => { clearTimeout(timer); reject(signal?.reason); };
      const timer = setTimeout(() => { signal?.removeEventListener('abort', abort); resolve(); }, delay);
      signal?.addEventListener('abort', abort, { once: true });
    });
    if (fail) throw new Error('일정을 불러오지 못했습니다.');
  };
  return {
    async list(signal) { await wait(signal); return structuredClone(items); },
    async create(input) {
      await wait();
      const event: CalendarEvent = { ...input, id: crypto.randomUUID() };
      items = [...items, event];
      return event;
    },
    async update(id, input) {
      await wait();
      const event: CalendarEvent = { ...input, id };
      items = items.map(each => (each.id === id ? event : each));
      return event;
    },
    async remove(id) { await wait(); items = items.filter(each => each.id !== id); },
  };
}
