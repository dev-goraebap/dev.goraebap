---
arc42: "8.4"
---

# 코드 규칙 예시

규칙은 [코드 규칙](../references/code-style.md)에 있습니다. 프로젝트 스택과 같은 절만 읽습니다.

## react

컴포넌트 파일은 PascalCase로 컴포넌트 이름과 같게 짓고, 훅은 `use`로 시작합니다. 훅·유틸·설정 파일 이름은 kebab-case로 적습니다.

| 대상 | 이름 규칙 |
| - | - |
| 컴포넌트 | PascalCase, 파일 하나에 컴포넌트 하나 |
| 페이지 | Page 접미사 (`RolesPage.tsx`) |
| 훅 | `use` 접두사, 파일은 kebab-case |
| 유틸 · 설정 | kebab-case |

출처: [web/src/pages/\_app/instance/members](https://github.com/dev-goraebap/cowork/tree/570d27da402451fe2ca06fca74862dd3899555c9/web/src/pages/_app/instance/members)

```text
members/
  page.tsx            # 주소의 화면 파일 (라우터가 정한 이름)
  api/roles.ts
  ui/RolesPage.tsx
```

파생값은 렌더 중에 바로 계산하고, `useEffect`는 외부 구독과 동기화에만 쓰며 정리 함수로 해제합니다. `useMemo`·`useCallback`은 측정된 비용이나 참조 안정성이 필요한 경계에만 씁니다. Strict Mode의 이중 실행에서 드러난 문제는 `useRef` 플래그로 막지 않고 정리 함수를 고칩니다.

## angular

Angular 스타일 가이드를 따라 파일 이름은 kebab-case로 적고, 클래스 이름은 PascalCase로 짓습니다. 페이지 컴포넌트는 `-page` 파일과 `Page` 클래스로, 라우트 파일은 폴더마다 `routes.ts`로 둡니다.

| 대상 | 파일 | 클래스 |
| - | - | - |
| 컴포넌트 | `account-shell.ts` | `AccountShell` |
| 페이지 | `profile-page.ts` | `ProfilePage` |
| 라우트 | `routes.ts` | 없음 (기본 내보내기) |

출처: [web/apps/accounts/src/pages/account/profile/routes.ts](https://github.com/dev-goraebap/dev.goraebap/blob/9ab5efcb944c053f149d5f6cb5e12d1359ef9c7a/web/apps/accounts/src/pages/account/profile/routes.ts)

```ts
import type { Routes } from "@angular/router";
import { ProfilePage } from "./ui/profile-page";

export default [
  { path: "", component: ProfilePage, title: "프로필 · goraebap accounts" },
] satisfies Routes;
```

파생값은 `computed()`로 두고, `effect()`는 시그널을 화면 밖(저장소, 외부 라이브러리)에 맞출 때만 씁니다. 해제가 필요한 구독은 `DestroyRef`나 `effect`의 `onCleanup`으로 정리합니다.

출처: [web/apps/accounts/src/pages/login/ui/login-page.ts](https://github.com/dev-goraebap/dev.goraebap/blob/9ab5efcb944c053f149d5f6cb5e12d1359ef9c7a/web/apps/accounts/src/pages/login/ui/login-page.ts)

```ts
  // 로그인 뒤 돌아갈 주소(검색 조건 next). 허용한 도메인만 따른다.
  readonly next = input<string>();
  // …
  protected readonly safeNext = computed(() => resolveSafeNextUrl(this.next()));
  protected readonly step = signal<Step>("email");
  // …
  protected readonly lead = computed(() =>
    this.step() === "setup"
      ? "아직 등록된 계정이 없습니다. 첫 관리자 계정을 만들어 주세요."
      : this.safeNext()
        ? "로그인하면 요청한 서비스로 바로 돌아갑니다."
        : "이메일 인증 코드로 로그인합니다.",
  );
```

입력(`next`)과 단계(`step`)에서 계산하는 안내 문구와 돌아갈 주소를 상태로 복사하지 않고 `computed()`로 둡니다.
