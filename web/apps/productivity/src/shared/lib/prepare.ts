import type { QueryClient, QueryKey } from '@tanstack/react-query';
import { sessionOptions } from '@/shared/auth';
import { bodyStateOptions, RichBody } from '@/shared/ui/rich-body';

/**
 * 화면이 첫 그림에 쓸 것을 미리 읽는 도구. 라우트 loader와 대화상자(PanelHost)가 같은 준비 함수를 함께 쓴다.
 * 캐시가 있으면 기다리지 않고 그것으로 그리며, 오래된 데이터는 각 화면이 마운트할 때 갱신한다. 오류 표시는 각 화면이 맡는다.
 */
export type Prep = {
  client: QueryClient;
  /** 꼭 있어야 하는 것: 캐시가 있으면 그것을, 없으면 읽어 온다. 실패하면 준비가 멈춘다. */
  ensure: QueryClient['query'];
  ensureInfinite: QueryClient['infiniteQuery'];
  /** 있으면 좋은 것: ensure와 같되 실패해도 넘어간다. */
  prime: QueryClient['query'];
  primeInfinite: QueryClient['infiniteQuery'];
  /**
   * 본문: 첫 그림부터 완성돼 있어야 그 아래(활동 등)가 밀리지 않는다. 편집기 코드를 함께 받고 본문을 준비한다.
   * 오래된 캐시는 본문이 뒤에서 확인한다(server-store, stale-while-revalidate).
   */
  body: (base: string) => Promise<unknown>;
};

const prepared = new WeakMap<QueryClient, Map<string, QueryKey[]>>();

/** 주소(id) 하나의 준비를 돌리고, 무엇을 읽었는지 적어 둔다(isPrepared). */
export async function prepare(client: QueryClient, id: string, run: (prep: Prep) => Promise<unknown>) {
  const keys: QueryKey[] = [];
  const ensure: QueryClient['query'] = options => { keys.push(options.queryKey); return client.query({ ...options, staleTime: 'static' }); };
  const ensureInfinite: QueryClient['infiniteQuery'] = options => { keys.push(options.queryKey); return client.infiniteQuery({ ...options, staleTime: 'static' }); };
  const me = client.getQueryData(sessionOptions().queryKey);
  const prep: Prep = {
    client, ensure, ensureInfinite,
    // 실패는 삼킨다: 값은 쓰지 않고 캐시만 채운다.
    prime: options => ensure(options).catch(() => undefined as never),
    primeInfinite: options => ensureInfinite(options).catch(() => undefined as never),
    body: base => Promise.all([RichBody.preload(), me?.id ? prep.prime(bodyStateOptions(base, me.id)) : undefined]),
  };
  try {
    await run(prep);
    let entries = prepared.get(client);
    if (!entries) { entries = new Map(); prepared.set(client, entries); }
    entries.set(id, keys);
  } catch { /* 화면의 오류 표시로 넘어간다. */ }
}

/** 그 주소의 준비가 끝났고 읽은 것이 아직 캐시에 있는가: 대화상자가 불러오는 중을 건너뛸지 정한다. */
export function isPrepared(client: QueryClient, id: string) {
  const keys = prepared.get(client)?.get(id);
  return !!keys && keys.every(key => client.getQueryState(key)?.data !== undefined);
}
