# 라우팅과 화면 전환 (Angular)

공통 리소스 주소 계약과 전환·마스킹 원칙은 [라우팅과 화면 전환](index.md)을 따릅니다. Angular에서는 `provideRouter`의 View Transitions API, 함수형 리졸버(`ResolveFn`), `Router.events` 기반 진행 막대로 구현합니다.

## 1. 라우터 설정과 선조회 리졸버

`app.config.ts`에서 View Transitions와 입력 바인딩을 함께 활성화합니다.

```ts
import { ApplicationConfig } from "@angular/core";
import {
  provideRouter,
  withComponentInputBinding,
  withViewTransitions,
} from "@angular/router";
import { routes } from "./app.routes";

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      routes,
      withComponentInputBinding(),
      withViewTransitions(),
    ),
  ],
};
```

- `ResolveFn`에서 화면 컴포넌트와 같은 `queryOptions`를 `ServerState.ensure()`로 선조회합니다. 리졸버가 완료될 때까지 Angular Router는 이전 화면을 유지합니다.

```ts
import { inject } from "@angular/core";
import type { ResolveFn } from "@angular/router";
import { ServerState } from "@/shared/lib/server-state";
import { ItemsApi } from "../api/items";
import type { Item } from "../model/item";

export const itemDetailResolver: ResolveFn<Item> = (route) => {
  const id = route.paramMap.get("id")!;
  return inject(ServerState).ensure(inject(ItemsApi).detail(id));
};
```

## 2. 지연 진행 막대와 이동 중 주소

`Router.events`에서 `NavigationStart`와 종료 이벤트(`NavigationEnd`, `NavigationCancel`, `NavigationError`)를 구독해 `150ms` 임계와 `300ms` 최소 유지 시간을 구현합니다. 동시에 `pendingUrl` 시그널을 노출해 사이드바 메뉴가 응답 전에 먼저 선택 표시를 옮기도록 합니다.

```ts
import { DestroyRef, Injectable, inject, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
} from "@angular/router";

const SHOW_AFTER_MS = 150;
const KEEP_AT_LEAST_MS = 300;

@Injectable({ providedIn: "root" })
export class RouteTransitionState {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly moving = signal(false);
  readonly progressVisible = signal(false);
  readonly pendingUrl = signal<string | null>(null);

  private showTimer: number | null = null;
  private hideTimer: number | null = null;
  private shownAt = 0;

  constructor() {
    this.router.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.clearTimers();
        this.moving.set(true);
        this.pendingUrl.set(event.url);
        this.showTimer = window.setTimeout(() => {
          this.shownAt = Date.now();
          this.progressVisible.set(true);
        }, SHOW_AFTER_MS);
        return;
      }

      if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.clearTimers();
        this.moving.set(false);
        this.pendingUrl.set(null);
        const remaining = Math.max(0, KEEP_AT_LEAST_MS - (Date.now() - this.shownAt));
        this.hideTimer = window.setTimeout(() => this.progressVisible.set(false), remaining);
      }
    });
  }

  private clearTimers() {
    if (this.showTimer !== null) window.clearTimeout(this.showTimer);
    if (this.hideTimer !== null) window.clearTimeout(this.hideTimer);
    this.showTimer = null;
    this.hideTimer = null;
  }
}
```

- 앱 셸 본문 래퍼에는 `[attr.aria-busy]="transition.moving()"`을 바인딩하고, 최상단 `2px` 진행 막대와 `role="status"` 라이브 영역을 배치합니다.
- 사이드바 활성 경로는 `transition.pendingUrl() ?? router.url`을 기준으로 계산합니다.

## 3. List-Detail과 Routed Modal 패턴

### List-Detail 중첩 라우트

목록을 부모 라우트, 오른쪽 상세·생성·수정 칸을 `children`으로 두어 선택이 바뀌어도 부모 목록의 스크롤과 데이터가 유지되게 합니다.

```ts
import type { Routes } from "@angular/router";
import { ItemsShellPage } from "./ui/items-shell-page";
import { ItemDetailPane } from "./ui/item-detail-pane";
import { ItemEditorPane } from "./ui/item-editor-pane";
import { itemDetailResolver } from "./model/resolvers";

export default [
  {
    path: "",
    component: ItemsShellPage,
    children: [
      { path: "new", component: ItemEditorPane },
      { path: ":id", component: ItemDetailPane, resolve: { item: itemDetailResolver } },
      { path: ":id/edit", component: ItemEditorPane, resolve: { item: itemDetailResolver } },
    ],
  },
] satisfies Routes;
```

### Routed Modal 주소 마스킹

Angular Router에는 내장 주소 마스킹 옵션이 없으므로, 데스크톱에서는 목록을 유지한 채 대화상자 호스트를 열고 `Location.go()`로 주소창만 대상 주소로 바꿉니다. 직접 URL 진입, 새로고침, 휴대폰 환경에서는 일반 `/items/:id` 라우트가 독립 페이지로 열립니다.

```ts
import { Location } from "@angular/common";
import { Injectable, inject, signal } from "@angular/core";
import { Router } from "@angular/router";

@Injectable({ providedIn: "root" })
export class ItemPanelService {
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  readonly activeHref = signal<string | null>(null);
  private returnUrl: string | null = null;

  open(href: string, isMobile: boolean) {
    if (isMobile) {
      void this.router.navigateByUrl(href);
      return;
    }
    const alreadyOpen = this.activeHref() !== null;
    if (!alreadyOpen) {
      this.returnUrl = this.router.url;
      this.location.go(href);
    } else {
      // 대화상자 내부 이동은 히스토리를 쌓지 않고 교체
      this.location.replaceState(href);
    }
    this.activeHref.set(href);
  }

  close(fallbackUrl: string) {
    this.activeHref.set(null);
    this.location.replaceState(this.returnUrl ?? fallbackUrl);
    this.returnUrl = null;
  }

  expand() {
    const href = this.activeHref();
    if (!href) return;
    this.activeHref.set(null);
    this.returnUrl = null;
    void this.router.navigateByUrl(href, { replaceUrl: true });
  }
}
```

- 작성 중 초안은 `@Injectable({ providedIn: "root" })` 기반의 초안 저장소 서비스에 보관해 `expand()`로 독립 페이지로 전환되더라도 제목·본문·속성이 그대로 이어지게 합니다.
