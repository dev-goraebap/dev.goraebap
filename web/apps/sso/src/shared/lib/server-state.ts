import { Injectable, type Signal, computed, signal } from "@angular/core";

// 서버 데이터 캐시. 지침(상태와 데이터 흐름)의 다섯 규칙을 Angular 시그널로 지킨다.
// 1. 서버 데이터는 이 캐시가 소유하고, 화면은 캐시의 시그널을 읽기만 한다.
// 2. 라우트 준비(리졸버·가드)와 화면은 같은 조회 옵션(key·fetch)을 쓴다.
// 3. 변경 뒤에는 관련 키를 무효화해 다시 읽는다.
// 4. 캐시가 있으면 오래돼도 먼저 보이고 뒤에서 갱신한다.
// 5. 계정이 바뀌면 이전 계정의 캐시를 모두 비운다.

export interface QueryOptions<T> {
  key: readonly unknown[];
  fetch: () => Promise<T>;
  // 이 시간 안의 값은 다시 읽지 않는다(밀리초)
  staleTime?: number;
}

export interface QueryState<T> {
  data: Signal<T | undefined>;
  error: Signal<Error | null>;
  // 처음 읽는 중(보일 값이 없음)
  loading: Signal<boolean>;
  // 값을 보이면서 뒤에서 다시 읽는 중
  refreshing: Signal<boolean>;
  reload: () => Promise<void>;
}

interface Entry {
  data: ReturnType<typeof signal<unknown>>;
  error: ReturnType<typeof signal<Error | null>>;
  pending: ReturnType<typeof signal<boolean>>;
  fetchedAt: number;
  inflight?: Promise<unknown>;
  fetch: () => Promise<unknown>;
  staleTime: number;
}

const DEFAULT_STALE_TIME = 30_000;
const hash = (key: readonly unknown[]) => JSON.stringify(key);

export function queryOptions<T>(options: QueryOptions<T>): QueryOptions<T> {
  return options;
}

@Injectable({ providedIn: "root" })
export class ServerState {
  private readonly entries = new Map<string, Entry>();
  // 계정 전환으로 비운 뒤 늦게 도착한 응답을 버리기 위한 세대 번호
  private generation = 0;

  private entry<T>(options: QueryOptions<T>): Entry {
    const id = hash(options.key);
    let entry = this.entries.get(id);
    if (!entry) {
      entry = {
        data: signal<unknown>(undefined),
        error: signal<Error | null>(null),
        pending: signal(false),
        fetchedAt: 0,
        fetch: options.fetch,
        staleTime: options.staleTime ?? DEFAULT_STALE_TIME,
      };
      this.entries.set(id, entry);
    }
    return entry;
  }

  private load(entry: Entry): Promise<unknown> {
    if (entry.inflight) return entry.inflight;
    const generation = this.generation;
    entry.pending.set(true);
    entry.inflight = entry
      .fetch()
      .then((value) => {
        if (generation !== this.generation) return value;
        entry.data.set(value);
        entry.error.set(null);
        entry.fetchedAt = Date.now();
        return value;
      })
      .catch((error: unknown) => {
        if (generation === this.generation) {
          entry.error.set(error instanceof Error ? error : new Error(String(error)));
        }
        throw error;
      })
      .finally(() => {
        entry.inflight = undefined;
        entry.pending.set(false);
      });
    return entry.inflight;
  }

  // 라우트 준비용. 캐시가 있으면 오래됐어도 바로 돌려주고, 없으면 받을 때까지 기다린다.
  async ensure<T>(options: QueryOptions<T>): Promise<T> {
    const entry = this.entry(options);
    if (entry.fetchedAt) {
      if (Date.now() - entry.fetchedAt > entry.staleTime)
        void this.load(entry).catch(() => undefined);
      return entry.data() as T;
    }
    return (await this.load(entry)) as T;
  }

  // 화면용. 캐시 값을 먼저 보이고, 오래됐으면 뒤에서 다시 읽는다.
  watch<T>(options: QueryOptions<T>): QueryState<T> {
    const entry = this.entry(options);
    if (!entry.fetchedAt || Date.now() - entry.fetchedAt > entry.staleTime) {
      void this.load(entry).catch(() => undefined);
    }
    return {
      data: entry.data.asReadonly() as Signal<T | undefined>,
      error: entry.error.asReadonly(),
      loading: computed(() => entry.pending() && entry.data() === undefined),
      refreshing: computed(() => entry.pending() && entry.data() !== undefined),
      reload: () => this.load(entry).then(() => undefined),
    };
  }

  // 키 앞부분이 같은 캐시를 오래된 것으로 만들고 다시 읽는다. 다시 읽기가 실패해도 변경 자체는 성공으로 본다.
  async invalidate(prefix: readonly unknown[]): Promise<void> {
    const head = hash(prefix).slice(0, -1);
    const targets = [...this.entries.entries()].filter(([id]) => id.startsWith(head));
    await Promise.all(
      targets.map(([, entry]) => {
        entry.fetchedAt = 0;
        return this.load(entry).catch(() => undefined);
      }),
    );
  }

  // 로그아웃·계정 전환. 진행 중인 응답도 새 계정의 캐시에 들어오지 않게 한다.
  clear(): void {
    this.generation += 1;
    this.entries.clear();
  }
}
