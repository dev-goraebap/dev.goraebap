import { seedNotifications, type Notification, type NotificationApi } from '../entities/notification';

/** 메모리에만 저장하는 모의 저장소. 견본마다 새로 만들며 실제 서버·계정을 바꾸지 않는다. */
export function createNotificationApi({ delay = 120, fail = false, initial = seedNotifications }: {
  delay?: number; fail?: boolean; initial?: Notification[];
} = {}): NotificationApi {
  let items = structuredClone(initial);
  const wait = async (signal?: AbortSignal) => {
    signal?.throwIfAborted();
    await new Promise<void>(resolve => setTimeout(resolve, delay));
    signal?.throwIfAborted();
    if (fail) throw new Error('알림을 불러오지 못했습니다.');
  };
  const set = (id: string, archived: boolean) => { items = items.map(each => (each.id === id ? { ...each, archived } : each)); };
  return {
    async list(signal) { await wait(signal); return structuredClone(items); },
    async archive(id) { await wait(); set(id, true); },
    async restore(id) { await wait(); set(id, false); },
  };
}
