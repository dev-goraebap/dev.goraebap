---
title: 구성 요소와 실행 흐름 (Angular)
summary: 공통 구성 요소와 실행 흐름 규칙을 Angular Standalone · Signals · Injectable 서비스 코드에 매핑하는 기준입니다.
---

공통 책임과 상태 소유 경계는 [구성 요소와 실행 흐름](./index.md)을 따릅니다. Angular는 라우트 설정, Standalone 컴포넌트, DI 기반 서비스가 문법 차원에서 나뉘어 있으므로 각 단위의 책임 경계만 선명하게 유지하면 됩니다.

## 1. 구성 요소별 Angular 매핑

| 구성 요소 | 위치 | Angular 구현 |
| --- | --- | --- |
| **라우트 경계** | `pages/.../routes.ts`, `model/guards.ts` | `Routes`, 함수형 `canActivate`·`resolve`, `withComponentInputBinding()` |
| **뷰 · 컴포넌트** | `ui/*-page.ts`, `ui/*.ts` | Standalone `@Component` (`signal()`은 로컬 UI 상태만, `input()`으로 라우트·부모 입력 수신) |
| **모델 · 상태** | `model/*.ts` | 순수 TS 도메인 함수·타입 + (복합 상태 조율 시) `@Injectable` 상태/파사드 서비스 (Signals) |
| **서버 상태 · API** | `api/*.ts` | `@Injectable({ providedIn: "root" })` `*Api` 서비스 (`queryOptions` + 변경 후 `invalidate`) + `ServerState` |
| **통신 기반** | `shared/api/http.ts` | `HttpClient` (`withFetch()`) 래퍼, `ApiError` |

## 2. Angular 핵심 경계 규칙

### 라우트 경계와 입력 바인딩

- 경로 매칭, 인증 가드(`canActivate`), 지연 로딩(`loadChildren`)은 폴더의 `routes.ts`에 둡니다.
- `app.config.ts`에 `withComponentInputBinding()`을 켜고, 경로 파라미터와 쿼리 파라미터는 `ActivatedRoute`를 직접 구독하기보다 컴포넌트의 `input()`으로 받습니다.

### 컴포넌트는 템플릿과 로컬 Signal만 소유합니다

- 컴포넌트의 `signal()`은 저장 중(`saving`), 알림 표시(`saved`), 오류 문구, 입력 초안처럼 **로컬 UI 상태**에만 씁니다.
- 서버 데이터는 `ServerState.watch(this.api.list)`가 돌려주는 읽기 전용 Signal을 템플릿에서 바로 읽고, 컴포넌트 안에서 `HttpClient`를 직접 주입하지 않습니다.

### `*Api` 서비스와 순수 모델을 구분합니다

- 조회 옵션(`queryOptions`) 정의와 쓰기 요청 뒤 캐시 무효화(`invalidate`·`clear`)는 `api/`의 `*Api` 서비스가 맡습니다.
- 도메인 검증·정규화·계산은 DI가 필요 없는 순수 TypeScript 함수(`model/`)로 둡니다. 여러 `*Api`나 복합 클라이언트 상태를 조율해야 할 때만 `model/`에 별도 `@Injectable` 서비스를 추가합니다.

### 통신 기반은 `shared/api`로 일원화합니다

- 공통 HTTP 오류 변환(`ApiError`), 자격 증명(`withCredentials`), 기본 오류 메시지 처리는 `shared/api/http.ts` 래퍼에 모읍니다.

## 3. 실행 흐름 코드 예시

### 서버 상태 · API (`api/items.ts`)

```ts
import { Injectable, inject } from "@angular/core";
import { Api } from "@/shared/api/http";
import { ServerState, queryOptions } from "@/shared/lib/server-state";
import type { Item, CreateItemInput } from "../model/item";

const ITEMS_KEY = ["items"] as const;

@Injectable({ providedIn: "root" })
export class ItemsApi {
  private readonly api = inject(Api);
  private readonly state = inject(ServerState);

  readonly list = queryOptions<Item[]>({
    key: [...ITEMS_KEY, "list"],
    fetch: () => this.api.get<Item[]>("/api/v1/items", "목록을 불러오지 못했습니다."),
  });

  async create(input: CreateItemInput) {
    const created = await this.api.send<Item>(
      "POST",
      "/api/v1/items",
      input,
      "항목을 만들지 못했습니다.",
    );
    await this.state.invalidate(ITEMS_KEY);
    return created;
  }
}
```

### 라우트 경계 (`pages/workspace/items/routes.ts`)

```ts
import type { Routes } from "@angular/router";
import { ItemsPage } from "./ui/items-page";

export default [{ path: "", component: ItemsPage }] satisfies Routes;
```

### 뷰 · 컴포넌트 (`pages/workspace/items/ui/items-page.ts`)

```ts
import { Component, inject, signal } from "@angular/core";
import { ServerState } from "@/shared/lib/server-state";
import { ItemsApi } from "../api/items";
import { normalizeItemName } from "../model/item";

@Component({
  selector: "app-items-page",
  template: `/* 템플릿 렌더링 */`,
})
export class ItemsPage {
  private readonly api = inject(ItemsApi);
  protected readonly items = inject(ServerState).watch(this.api.list);

  // 저장 전 입력 초안과 진행 상태만 로컬 UI 상태로 관리
  protected draftName = "";
  protected readonly saving = signal(false);
  protected readonly error = signal<string | null>(null);

  protected async create() {
    const name = normalizeItemName(this.draftName);
    if (!name || this.saving()) return;
    this.error.set(null);
    this.saving.set(true);
    try {
      await this.api.create({ name });
      this.draftName = "";
    } catch (error) {
      this.error.set((error as Error).message);
    } finally {
      this.saving.set(false);
    }
  }
}
```
