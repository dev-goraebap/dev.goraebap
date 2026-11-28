# 상태 관리와 데이터 흐름 (React · TanStack)

공통 상태 소유 규칙과 데이터 흐름 원칙은 [상태 관리와 데이터 흐름](index.md)을 따릅니다. React · TanStack 스택에서는 서버 상태를 TanStack Query가, URL 상태를 TanStack Router가, 로컬 초안을 컴포넌트 `useState`가 소유합니다.

## 1. 조회 옵션과 캐시 키

조회 옵션은 해당 도메인이나 라우트 슬라이스의 `api/`에 `queryOptions()` 또는 `infiniteQueryOptions()`로 정의합니다. 응답을 바꾸는 모든 조건을 `queryKey`에 넣습니다.

```ts
import {
  infiniteQueryOptions,
  keepPreviousData,
  queryOptions,
} from "@tanstack/react-query";
import { api } from "@/shared/api/http";

export interface ItemListing {
  q?: string;
  status?: "open" | "archived";
  sort?: "recent" | "name";
}

export interface ItemSlice {
  items: Item[];
  nextCursor: string | null;
}

export const ITEM_KEYS = {
  all: ["items"] as const,
  list: (listing: ItemListing) => [...ITEM_KEYS.all, "list", listing] as const,
  detail: (id: string) => [...ITEM_KEYS.all, "detail", id] as const,
};

export const itemsInfiniteOptions = (listing: ItemListing) =>
  infiniteQueryOptions({
    queryKey: ITEM_KEYS.list(listing),
    queryFn: ({ pageParam, signal }) => {
      const params = new URLSearchParams({ size: "20" });
      if (listing.q) params.set("q", listing.q);
      if (listing.status) params.set("status", listing.status);
      if (listing.sort) params.set("sort", listing.sort);
      if (pageParam) params.set("cursor", pageParam);
      return api.get<ItemSlice>(`/api/v1/items?${params}`, { signal });
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    placeholderData: keepPreviousData,
  });

export const itemDetailOptions = (id: string) =>
  queryOptions({
    queryKey: ITEM_KEYS.detail(id),
    queryFn: ({ signal }) => api.get<Item>(`/api/v1/items/${id}`, { signal }),
    staleTime: 30_000,
  });
```

- `queryFn`이 전달받는 `signal`을 HTTP 래퍼(`fetch`)로 넘겨 쿼리 키가 바뀌거나 언마운트될 때 이전 요청이 자동 취소되게 합니다.
- 조건 변경 중 목록이 비어 깜빡이지 않게 하려면 `placeholderData: keepPreviousData`를 두고, 화면에서는 `isPlaceholderData`로 갱신 중임을 드러냅니다.

## 2. 라우트 준비 함수 (`ensure` · `prime`)

라우트 `loader`가 데이터를 선조회할 때는 실패 시 진입을 멈추는 필수 조회(`ensure`)와, 실패해도 화면으로 넘어가 개별 오류를 표시하는 선택 조회(`prime`)를 구분하는 준비 헬퍼를 둡니다.

```ts
import type { FetchQueryOptions, QueryClient, QueryKey } from "@tanstack/react-query";

export interface RoutePrep {
  ensure: <T>(options: FetchQueryOptions<T, Error, T, QueryKey>) => Promise<T>;
  prime: <T>(options: FetchQueryOptions<T, Error, T, QueryKey>) => Promise<T | undefined>;
}

export function createRoutePrep(queryClient: QueryClient): RoutePrep {
  const ensure: RoutePrep["ensure"] = (options) =>
    queryClient.ensureQueryData({ ...options, staleTime: Infinity });

  return {
    ensure,
    prime: (options) => ensure(options).catch(() => undefined),
  };
}
```

- `staleTime: Infinity`를 준비 단계에 지정하면 이미 캐시에 값이 있을 때 전환을 멈추지 않고 즉시 통과하고, 화면 컴포넌트의 `useQuery`가 원래 `staleTime` 기준으로 백그라운드 재조회(`stale-while-revalidate`)를 수행합니다.
- 사용 중단(deprecated)된 옵션이나 예전 버전 API 대신 현재 설치된 TanStack Query 메이저 버전이 권장하는 시그니처를 씁니다.

## 3. 변경(Mutation), 무효화, 계정 전환

```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/http";
import { ITEM_KEYS } from "./items";

export function useUpdateItem(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateItemInput) =>
      api.patch<Item>(`/api/v1/items/${id}`, payload),
    onSuccess: () => {
      // 저장 성공 후 재조회 실패가 저장 실패로 전파되지 않게 분리
      void queryClient.invalidateQueries({ queryKey: ITEM_KEYS.detail(id) });
      void queryClient.invalidateQueries({ queryKey: ITEM_KEYS.all });
    },
  });
}
```

- 로그아웃이나 계정·워크스페이스 전환 직후에는 진행 중 조회를 취소하고 캐시를 비웁니다.

```ts
export async function resetSessionCache(queryClient: QueryClient) {
  await queryClient.cancelQueries();
  queryClient.clear();
}
```

## 4. 서버 데이터와 초안 분리 · 판본 비교

저장 요청 중에도 계속 입력할 수 있는 폼에서는 초안 판본(`revision`)을 올려 늦은 응답이 최신 입력을 덮어쓰지 않게 합니다.

```tsx
import { useRef, useState } from "react";

export function useEditableTitle(serverTitle: string, onSave: (title: string) => Promise<void>) {
  const [draft, setDraft] = useState<string | null>(null);
  const revisionRef = useRef(0);
  const value = draft ?? serverTitle;

  function change(next: string) {
    revisionRef.current += 1;
    setDraft(next);
  }

  async function save() {
    if (draft === null) return;
    const sentRevision = revisionRef.current;
    await onSave(draft);
    // 저장 도중 추가 입력이 없었을 때만 초안을 해제하고 서버 값으로 복귀
    if (revisionRef.current === sentRevision) {
      setDraft(null);
    }
  }

  return { value, dirty: draft !== null, change, save, discard: () => setDraft(null) };
}
```

## 5. 검색 입력 디바운스와 요청 취소

검색어 입력은 `200~300ms` 디바운스하되, 빈 값과 `Enter` 제출은 즉시 반영합니다. TanStack Query를 쓰는 경우 `queryFn`에 전달되는 `signal`을 넘기면 검색어가 바뀔 때 이전 요청이 자동 취소됩니다.

```ts
import { useEffect, useState } from "react";

export function useDebouncedSearch(initial = "", delayMs = 250) {
  const [input, setInput] = useState(initial);
  const [committed, setCommitted] = useState(initial);

  useEffect(() => {
    const trimmed = input.trim();
    if (!trimmed) {
      setCommitted("");
      return;
    }
    const timer = window.setTimeout(() => setCommitted(trimmed), delayMs);
    return () => window.clearTimeout(timer);
  }, [input, delayMs]);

  const submitNow = () => setCommitted(input.trim());

  return { input, setInput, committed, submitNow };
}
```

- `committed` 값을 `itemsInfiniteOptions({ q: committed })`의 캐시 키로 넘기거나, URL 검색 파라미터(`navigate({ search: ..., replace: true })`)로 반영해 조회를 실행합니다.
- 쿼리 라이브러리를 거치지 않고 직접 `fetch`를 호출하는 특수한 경우에도 반드시 `AbortController`를 생성해 정리 함수(`return () => controller.abort()`)에서 취소하고, `AbortError`는 오류 상태로 취급하지 않습니다.
