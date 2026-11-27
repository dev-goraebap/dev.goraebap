---
title: 렌더링과 초기 로딩 (Angular)
summary: Angular의 provideAppInitializer 초기 부트, 라우트 지연 로딩, @defer 사용 경계와 정적 프리렌더 기준입니다.
---

공통 렌더링 방식 선택과 초기 부트·지연 로딩 원칙은 [렌더링과 초기 로딩](./index.md)을 따릅니다. Angular에서는 `provideAppInitializer`, 라우트 단위 `loadChildren`/`loadComponent`, 그리고 `@defer` 블록의 경계 규칙으로 구현합니다.

## 1. 초기 진입과 `provideAppInitializer`

`index.html`에 테마 선적용 스크립트와 인라인 스플래시 오버레이를 배치하고, `app.config.ts`의 `provideAppInitializer`에서 초기 세션 조회 등 필수 부트 작업을 끝낸 뒤 첫 화면을 드러냅니다.

```ts
import { ApplicationConfig, inject, provideAppInitializer } from "@angular/core";
import { ServerState } from "@/shared/lib/server-state";
import { SessionApi } from "@/entities/session";

export const appConfig: ApplicationConfig = {
  providers: [
    provideAppInitializer(async () => {
      const state = inject(ServerState);
      const session = inject(SessionApi);
      try {
        await state.ensure(session.me);
      } catch {
        // 인증 실패나 일시 오류 시 부트를 영구 차단하지 않고
        // 라우트 가드 또는 오류 화면으로 즉시 전환
      }
    }),
  ],
};
```

- 부트가 완료되어 루트 컴포넌트가 렌더링되면 `index.html`에 삽입해 둔 스플래시 오버레이에 페이드아웃 클래스를 부여해 최소 `0.3s` 이후 제거합니다.
- 초기 요청이 실패하더라도 `provideAppInitializer`가 영구 보류되거나 미처리 예외로 앱 전체가 멈추지 않게 처리하고, 오류 폴백이나 로그인 화면으로 넘깁니다.

## 2. 라우트 지연 로딩과 리졸버 병렬 준비

라우트 분할은 `routes.ts`의 `loadChildren`과 `loadComponent`를 기본으로 합니다.

```ts
import type { Routes } from "@angular/router";
import { itemDetailResolver } from "./model/resolvers";

export const routes: Routes = [
  {
    path: "items",
    loadChildren: () => import("./pages/items/routes"),
  },
  {
    path: "items/:id",
    loadComponent: () =>
      import("./pages/items/detail/ui/item-detail-page").then((m) => m.ItemDetailPage),
    resolve: { item: itemDetailResolver },
  },
];
```

- 라우트 활성화 단계에서 Angular Router가 `loadComponent` 청크 다운로드와 `resolve` 데이터 조회를 함께 마무리한 뒤 View Transition으로 화면을 교체합니다.

## 3. `@defer` 블록 사용 경계

Angular의 `@defer`는 화면 하단 보조 영역이나 탭 내부의 무거운 차트·에디터를 지연 로드할 때 유용하지만, 레이아웃 이동(CLS)을 유발하지 않도록 아래 경계를 지킵니다.

- **핵심 본문 지연 금지**: 첫 화면의 주된 배치 높이를 결정하는 본문 영역에는 `@defer`를 쓰지 않고 라우트 단위 분할과 리졸버로 전환 전에 준비합니다.
- **고정 높이 `@placeholder`와 최소 유지**: 화면 하단이나 보조 패널에 `@defer`를 쓸 때는 실제 컴포넌트와 같은 높이의 `@placeholder`를 두고, `@loading (after 150ms; minimum 300ms)` 옵션을 함께 지정해 짧은 깜빡임을 막습니다.

```html
@defer (on viewport; prefetch on idle) {
  <app-activity-chart [itemId]="item().id" />
} @placeholder {
  <div class="h-64 rounded-lg border border-border"></div>
} @loading (after 150ms; minimum 300ms) {
  <div class="h-64 animate-pulse rounded-lg bg-muted"></div>
}
```

## 4. 공개 페이지 정적 생성 (SSG)

검색 노출이 필요한 공개 페이지는 `@angular/ssr`의 `prerender` 옵션으로 빌드 타임에 정적 HTML을 생성하고 정적 파일 호스팅으로 배포합니다. 로그인 뒤 업무 앱은 CSR 빌드를 유지합니다.
