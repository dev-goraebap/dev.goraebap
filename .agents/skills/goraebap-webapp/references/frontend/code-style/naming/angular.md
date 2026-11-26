# 파일과 이름 (angular)

공통 규칙은 [index.md](index.md)에 있습니다.

## naming

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
