# 코드 스타일과 네이밍 (Angular)

공통 코드 스타일과 파생값·부수 효과 분리 원칙은 [코드 스타일과 네이밍](index.md)을 따릅니다.

## 1. 파일과 클래스 명명

Angular 공식 스타일 가이드를 따라 파일 이름은 `kebab-case`, 클래스 이름은 `PascalCase`로 통일합니다.

| 대상 | 파일 이름 | 클래스 / 심볼 | 예시 |
| - | - | - | - |
| 일반 컴포넌트 | `<name>.ts` | `PascalCase` | `item-filter-bar.ts` → `ItemFilterBar` |
| 페이지 컴포넌트 | `<name>-page.ts` | `*Page` | `items-page.ts` → `ItemsPage` |
| 라우트 정의 | `routes.ts` | 기본 내보내기 (`Routes`) | `pages/workspace/items/routes.ts` |
| API 서비스 | `<name>.ts` | `*Api` | `items.ts` → `ItemsApi` |
| 상태 · 도메인 서비스 | `<name>.ts` | `*Service` / `*State` | `item-draft.ts` → `ItemDraftState` |
| 순수 모델 · 유틸 | `<name>.ts` | 함수 · 인터페이스 | `item-filter.ts` |

```tree
# title: Angular 라우트 슬라이스 파일 명명 예시
pages/workspace/items/
  routes.ts              # 라우트 경계 (기본 내보내기)
  api/
    items.ts             # ItemsApi (@Injectable)
  model/
    item-filter.ts       # 순수 TypeScript 계산·검증
  ui/
    items-page.ts        # ItemsPage (Standalone @Component)
    item-filter-bar.ts   # ItemFilterBar
```

- 컴포넌트는 Standalone 기본값으로 작성하고, 의존성 주입은 생성자 매개변수 대신 `inject()` 함수를 일관되게 사용합니다.
- 입력·출력·상태는 데코레이터(`@Input`, `@Output`) 대신 Signal API(`input()`, `output()`, `model()`, `signal()`)를 우선합니다.

## 2. `computed()` 파생값과 `effect()` 경계

- **파생값은 `computed()`로 선언합니다**: 입력(`input()`)이나 `signal()`에서 계산할 수 있는 값은 별도 `signal()`에 복사하고 `effect()`로 갱신하지 않습니다.

```ts
import { Component, computed, input, signal } from "@angular/core";
import { resolveSafeNextUrl } from "../model/redirect";

type Step = "email" | "code" | "setup";

@Component({
  selector: "app-login-page",
  template: `/* 템플릿 */`,
})
export class LoginPage {
  readonly next = input<string>();
  protected readonly step = signal<Step>("email");

  // 입력과 단계에서 계산되는 값은 모두 computed()로 유지
  protected readonly safeNext = computed(() => resolveSafeNextUrl(this.next()));
  protected readonly leadMessage = computed(() => {
    if (this.step() === "setup") return "첫 관리자 계정을 만들어 주세요.";
    if (this.safeNext()) return "로그인하면 요청한 화면으로 바로 돌아갑니다.";
    return "이메일 인증 코드로 로그인합니다.";
  });
}
```

- **`effect()`는 외부 동기화 전용입니다**: `localStorage`, DOM 속성(`document.documentElement.dataset`), 외부 캔버스·차트 라이브러리처럼 Signal 그래프 바깥과 맞출 때만 씁니다. `effect()` 안에서 다른 앱 상태 Signal을 연쇄적으로 쓰지 않습니다.
- **구독과 자원 해제**: `effect()` 안에서 만든 타이머·리스너·`AbortController`는 `onCleanup` 콜백으로 해제합니다. RxJS 스트림을 구독할 때는 `takeUntilDestroyed(this.destroyRef)`를 사용해 컴포넌트 파괴 시 자동으로 정리합니다.

```ts
export class ThemeSync {
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = (event: MediaQueryListEvent) => this.apply(event.matches);
    media.addEventListener("change", listener);
    this.destroyRef.onDestroy(() => media.removeEventListener("change", listener));
  }
}
```

## 3. 템플릿과 변경 감지 위생

- 템플릿 제어 흐름은 구조 지시어(`*ngIf`, `*ngFor`) 대신 내장 제어 흐름(`@if`, `@for ...; track ...`, `@switch`)을 사용합니다.
- `@for`의 `track`에는 인덱스 대신 안정적인 고유 식별자(`item.id`)를 지정해 불필요한 DOM 재생성을 막습니다.
- 모든 컴포넌트는 `ChangeDetectionStrategy.OnPush`(또는 zoneless) 환경에서 안전하게 동작하도록 Signal 기반 읽기를 전제로 작성합니다.
