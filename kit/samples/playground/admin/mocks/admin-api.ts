import type { AdminApi, Matrix, Rejection, Tag, User } from '../entities/admin';
import { seedMatrix, seedTags, seedUsers } from './seed';

const reject = (value: string, message: string): Rejection => Object.assign(new Error(message), { code: 'duplicate' as const, value });

/** 메모리에만 저장하는 모의 저장소. 견본마다 새로 만들며 실제 서버·계정을 바꾸지 않는다. */
export function createAdminApi({ delay = 180, fail = false, tags = seedTags, users = seedUsers, matrix = seedMatrix }: {
  delay?: number; fail?: boolean; tags?: Tag[]; users?: User[]; matrix?: Matrix;
} = {}): AdminApi {
  let tagItems = structuredClone(tags);
  let userItems = structuredClone(users);
  let permissions = structuredClone(matrix);
  const wait = async (signal?: AbortSignal) => {
    signal?.throwIfAborted();
    await new Promise<void>((resolve, stop) => {
      const abort = () => { clearTimeout(timer); stop(signal?.reason); };
      const timer = setTimeout(() => { signal?.removeEventListener('abort', abort); resolve(); }, delay);
      signal?.addEventListener('abort', abort, { once: true });
    });
    if (fail) throw new Error('요청을 처리하지 못했습니다.');
  };
  const sameName = (name: string, except?: string) => tagItems.some(tag => tag.id !== except && tag.name.toLowerCase() === name.toLowerCase());
  return {
    tags: {
      async list(signal) { await wait(signal); return structuredClone(tagItems); },
      async create(input) {
        await wait();
        if (sameName(input.name)) throw reject(input.name, '이미 있는 태그입니다.');
        const tag: Tag = { ...input, id: crypto.randomUUID(), count: 0 };
        tagItems = [...tagItems, tag];
        return tag;
      },
      async update(id, patch) {
        await wait();
        if (patch.name && sameName(patch.name, id)) throw reject(patch.name, '이미 있는 태그입니다.');
        const next = { ...tagItems.find(tag => tag.id === id)!, ...patch };
        tagItems = tagItems.map(tag => (tag.id === id ? next : tag));
        return next;
      },
      async remove(id) { await wait(); tagItems = tagItems.filter(tag => tag.id !== id); },
    },
    users: {
      async list(signal) { await wait(signal); return structuredClone(userItems); },
      async invite({ emails, role }) {
        await wait();
        const taken = emails.find(email => userItems.some(user => user.email.toLowerCase() === email.toLowerCase()));
        if (taken) throw reject(taken, '이미 있는 사용자입니다.');
        const added: User[] = emails.map(email => ({ id: crypto.randomUUID(), name: email.split('@')[0], email, role, status: 'invited', lastSeen: null }));
        userItems = [...userItems, ...added];
        return added;
      },
      async update(ids, patch) { await wait(); userItems = userItems.map(user => (ids.includes(user.id) ? { ...user, ...patch } : user)); },
      async resend() { await wait(); },
    },
    permissions: {
      async get(signal) { await wait(signal); return structuredClone(permissions); },
      async save(next) { await wait(); permissions = structuredClone({ ...next, admin: permissions.admin }); return structuredClone(permissions); },
    },
  };
}
