---
title: 구성 요소와 실행 흐름 (React · TanStack)
summary: 공통 구성 요소와 실행 흐름 규칙을 React · TanStack Router · TanStack Query 코드에 매핑하는 기준입니다.
---

공통 책임과 상태 소유 경계는 [구성 요소와 실행 흐름](./index.md)을 따릅니다. React는 프레임워크가 클래스나 서비스 계층을 강제하지 않으므로, 파일 역할과 훅 경계를 명시적으로 지켜야 컴포넌트 비대화를 막을 수 있습니다.

## 1. 구성 요소별 React · TanStack 매핑

| 구성 요소 | 위치 | React · TanStack 구현 |
| --- | --- | --- |
| **라우트 경계** | `pages/.../route.tsx`, `page.tsx` | `createFileRoute` (`validateSearch`, `beforeLoad`, `loader`) |
| **뷰 · 컴포넌트** | `ui/*.tsx` | 화면·섹션 컴포넌트 + 순수 표시 컴포넌트 (`useState`는 로컬 UI 상태만) |
| **모델 · 상태** | `model/*.ts` | 프레임워크 무관 순수 TS 함수·타입 + 얇은 커스텀 훅(`use*.ts`) |
| **서버 상태 · API** | `api/*.ts` | TanStack Query `queryOptions()` + `useMutation` / 변경 함수 |
| **통신 기반** | `shared/api/http.ts` | `fetch` 래퍼, `ApiError` |

## 2. React · TanStack 핵심 경계 규칙

### `page.tsx`는 라우트 경계로만 얇게 유지합니다

- `page.tsx`에는 `createFileRoute`의 `validateSearch`, `beforeLoad`, `loader`와 최상위 화면 컴포넌트 연결만 둡니다.
- 화면 마크업, 폼 입력, 섹션 조합은 같은 폴더의 `ui/` 컴포넌트로 분리합니다.

### 비즈니스 로직은 훅 밖의 순수 함수로 먼저 분리합니다

- 계산, 필터링, 유효성 검증, 포맷팅 같은 도메인 로직은 `use*` 훅이나 컴포넌트 안에 직접 쓰지 않고 `model/`의 순수 TypeScript 함수로 작성합니다.
- 커스텀 훅(`model/use*.ts`)은 React 생명주기·라우터·TanStack Query를 조합하는 얇은 어댑터 역할만 맡습니다.

### 컴포넌트에서 `fetch`와 `useEffect` 조회를 금지합니다

- 서버 데이터 읽기는 `api/`에 정의한 `queryOptions()`를 `loader`의 `ensureQueryData`와 컴포넌트의 `useQuery`·`useSuspenseQuery`가 함께 사용합니다.
- 서버 변경은 `api/`의 뮤테이션 훅(`useMutation`)으로 감싸고 `onSuccess`에서 관련 쿼리 키를 무효화합니다.

### `useState`와 `useEffect` 오용을 피합니다

- `useState`에는 모달 열림, 탭 상태, 저장 전 입력 초안처럼 **로컬 UI 상태**만 둡니다.
- 서버 응답이나 props에서 계산할 수 있는 파생 값은 `useState` + `useEffect`로 동기화하지 않고 렌더링 중에 바로 계산합니다.

## 3. 실행 흐름 코드 예시

### 서버 상태 · API (`api/items.ts`)

```ts
import { queryOptions, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/http";
import type { Item, CreateItemInput } from "../model/item";

export const ITEM_KEYS = {
  all: ["items"] as const,
  list: (filter?: string) => [...ITEM_KEYS.all, "list", filter ?? ""] as const,
};

export const itemsOptions = (filter?: string) =>
  queryOptions({
    queryKey: ITEM_KEYS.list(filter),
    queryFn: () => api.get<Item[]>(`/api/v1/items?q=${encodeURIComponent(filter ?? "")}`),
    staleTime: 30_000,
  });

export function useCreateItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateItemInput) => api.post<Item>("/api/v1/items", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ITEM_KEYS.all }),
  });
}
```

### 순수 모델 (`model/item.ts`)

```ts
export interface Item {
  id: string;
  name: string;
  archived: boolean;
}

export interface CreateItemInput {
  name: string;
}

export function normalizeItemName(raw: string): string | null {
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}
```

### 라우트 경계 (`pages/_app/items/page.tsx`)

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { itemsOptions } from "./api/items";
import { ItemsView } from "./ui/ItemsView";

export const Route = createFileRoute("/_app/items/")({
  validateSearch: (search: Record<string, unknown>): { q?: string } => ({
    q: typeof search.q === "string" && search.q.length > 0 ? search.q : undefined,
  }),
  loaderDeps: ({ search }) => ({ q: search.q }),
  loader: ({ context, deps }) => context.queryClient.ensureQueryData(itemsOptions(deps.q)),
  component: ItemsView,
});
```

### 뷰 · 컴포넌트 (`pages/_app/items/ui/ItemsView.tsx`)

```tsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Route } from "../page";
import { itemsOptions, useCreateItem } from "../api/items";
import { normalizeItemName } from "../model/item";

export function ItemsView() {
  const { q } = Route.useSearch();
  const { data = [] } = useQuery(itemsOptions(q));
  const createItem = useCreateItem();
  // 저장 전 입력 초안만 로컬 UI 상태로 관리
  const [draftName, setDraftName] = useState("");

  function handleSubmit() {
    const name = normalizeItemName(draftName);
    if (!name || createItem.isPending) return;
    createItem.mutate({ name }, { onSuccess: () => setDraftName("") });
  }

  return /* UI 렌더링 */;
}
```
