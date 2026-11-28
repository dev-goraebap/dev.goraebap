# 상태 관리와 데이터 흐름 (Angular)

공통 상태 소유 규칙과 데이터 흐름 원칙은 [상태 관리와 데이터 흐름](index.md)을 따릅니다. Angular에서는 `ServerState` 서비스가 서버 상태 캐시를, Router와 `withComponentInputBinding()`이 URL 상태를, 컴포넌트의 `signal()`이 로컬 UI 초안을 소유합니다.

## 1. 조회 옵션과 `ServerState` 캐시

조회 옵션은 슬라이스 `api/`의 `*Api` 서비스에 `queryOptions()`로 정의합니다. 라우트 가드·리졸버는 `ensure()`로, 화면 컴포넌트는 `watch()`로 같은 조회 옵션을 읽습니다.

```ts
import { Injectable, inject } from "@angular/core";
import { Api } from "@/shared/api/http";
import { ServerState, queryOptions } from "@/shared/lib/server-state";
import type { Item, ItemListing, UpdateItemInput } from "../model/item";

export const ITEM_KEYS = {
  all: ["items"] as const,
  list: (listing: ItemListing) => [...ITEM_KEYS.all, "list", listing] as const,
  detail: (id: string) => [...ITEM_KEYS.all, "detail", id] as const,
};

@Injectable({ providedIn: "root" })
export class ItemsApi {
  private readonly api = inject(Api);
  private readonly state = inject(ServerState);

  list(listing: ItemListing) {
    return queryOptions<Item[]>({
      key: ITEM_KEYS.list(listing),
      staleTime: 30_000,
      fetch: (signal) =>
        this.api.get<Item[]>("/api/v1/items", { params: listing, signal }),
    });
  }

  detail(id: string) {
    return queryOptions<Item>({
      key: ITEM_KEYS.detail(id),
      staleTime: 30_000,
      fetch: (signal) => this.api.get<Item>(`/api/v1/items/${id}`, { signal }),
    });
  }

  async update(id: string, payload: UpdateItemInput): Promise<Item> {
    const updated = await this.api.send<Item>("PATCH", `/api/v1/items/${id}`, payload);
    // 재조회 실패가 저장 실패로 전파되지 않게 invalidate 내부에서 오류를 분리 처리
    await this.state.invalidate(ITEM_KEYS.all);
    return updated;
  }
}
```

## 2. 캐시 우선 표시와 계정 전환 격리

`ServerState`는 세대(`generation`) 번호와 `AbortController`를 함께 관리해, 로그아웃이나 계정 전환 뒤 늦게 도착한 이전 응답이 새 계정의 캐시에 쓰이지 않게 차단합니다.

```ts
@Injectable({ providedIn: "root" })
export class ServerState {
  private generation = 0;
  private readonly entries = new Map<string, CacheEntry<unknown>>();

  /** 라우트 가드·리졸버용: 캐시가 신선하면 즉시 반환, 없으면 조회 후 반환 */
  ensure<T>(options: QueryOptions<T>): Promise<T> {
    const entry = this.entry(options);
    if (entry.hasValue && !this.isStale(entry)) return Promise.resolve(entry.data() as T);
    return this.load(entry);
  }

  /** 화면 컴포넌트용: 캐시 값을 즉시 노출하고 오래됐으면 뒤에서 재조회 */
  watch<T>(options: QueryOptions<T>): QueryState<T> {
    const entry = this.entry(options);
    if (!entry.fetchedAt || this.isStale(entry)) {
      void this.load(entry).catch(() => undefined);
    }
    return entry.view;
  }

  /** 키 접두사가 일치하는 항목을 무효화하고 활성 구독만 다시 조회 */
  async invalidate(prefix: readonly unknown[]): Promise<void> {
    const targets = [...this.entries.values()].filter((e) => hasPrefix(e.key, prefix));
    await Promise.allSettled(targets.map((e) => this.load(e)));
  }

  /** 로그아웃·계정 전환: 진행 중 요청을 취소하고 세대를 올려 늦은 응답 차단 */
  clear(): void {
    this.generation += 1;
    for (const entry of this.entries.values()) {
      entry.controller?.abort();
    }
    this.entries.clear();
  }
}
```

## 3. 서버 데이터와 로컬 초안 분리

컴포넌트에서는 서버 캐시가 돌려주는 읽기 전용 Signal과 입력 초안 Signal을 분리합니다. `draft()`가 `null`이면 서버 값을 표시하고, 사용자가 편집을 시작하면 초안만 갱신해 백그라운드 재조회가 입력 내용을 덮어쓰지 않게 합니다.

```ts
@Component({
  selector: "app-item-editor",
  template: `
    <input
      [value]="displayTitle()"
      (input)="onTitleInput($any($event.target).value)"
    />
  `,
})
export class ItemEditor {
  readonly serverTitle = input.required<string>();
  protected readonly draft = signal<string | null>(null);
  private revision = 0;

  protected readonly displayTitle = computed(() => this.draft() ?? this.serverTitle());

  protected onTitleInput(next: string) {
    this.revision += 1;
    this.draft.set(next);
  }

  protected async save(commit: (title: string) => Promise<void>) {
    const value = this.draft();
    if (value === null) return;
    const sentRevision = this.revision;
    await commit(value);
    if (this.revision === sentRevision) {
      this.draft.set(null);
    }
  }
}
```

## 4. 검색 입력 디바운스와 요청 취소

검색 입력은 `effect()`의 `onCleanup`과 `AbortController`를 조합해 디바운스 타이머와 진행 중 요청을 함께 정리합니다. 빈 입력과 `Enter` 제출은 즉시 실행합니다.

```ts
export class ItemSearchBar {
  private readonly api = inject(ItemsApi);

  protected readonly rawQuery = signal("");
  protected readonly results = signal<Item[]>([]);
  protected readonly loading = signal(false);

  constructor() {
    effect((onCleanup) => {
      const q = this.rawQuery().trim();
      if (!q) {
        this.results.set([]);
        this.loading.set(false);
        return;
      }

      const controller = new AbortController();
      const timer = window.setTimeout(() => {
        void this.fetchSearch(q, controller.signal);
      }, 250);

      onCleanup(() => {
        window.clearTimeout(timer);
        controller.abort();
      });
    });
  }

  protected submitNow() {
    const q = this.rawQuery().trim();
    if (!q) return;
    void this.fetchSearch(q);
  }

  private async fetchSearch(q: string, signal?: AbortSignal) {
    this.loading.set(true);
    try {
      const data = await this.api.list({ q }).fetch(signal);
      this.results.set(data);
    } catch (error) {
      if ((error as Error).name !== "AbortError") throw error;
    } finally {
      this.loading.set(false);
    }
  }
}
```

- `HttpClient` 스트림(RxJS)을 직접 쓰는 검색 화면이라면 `debounceTime(250)`, `distinctUntilChanged()`, `switchMap()`을 연결하고 `takeUntilDestroyed(this.destroyRef)`로 구독을 해제합니다. `switchMap`이 새 검색어가 들어올 때 이전 HTTP 요청을 자동 취소합니다.
