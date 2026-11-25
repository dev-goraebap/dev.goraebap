# 화면 계층 (angular)

공통 규칙은 [index.md](index.md)에 있습니다.

## routing

Angular 라우터는 파일 라우팅이 없어서 폴더마다 `routes.ts`를 두고, 부모 폴더의 라우트 파일이 `loadChildren`으로 자식 폴더의 것을 잇습니다. 화면 컴포넌트는 그 폴더의 `ui/`에 둡니다.

```text
pages/
  account/
    routes.ts         # 셸과 가드. 아래 폴더들을 잇는다
    ui/account-shell.ts
    profile/
      routes.ts       # 빈 경로에 화면 하나
      ui/profile-page.ts
    security/
      routes.ts
      ui/security-page.ts
  login/
    routes.ts
    ui/login-page.ts
```

출처: [web/apps/accounts/src/app/app.routes.ts](https://github.com/dev-goraebap/dev.goraebap/blob/9ab5efcb944c053f149d5f6cb5e12d1359ef9c7a/web/apps/accounts/src/app/app.routes.ts)

```ts
// 주소 하나가 pages 아래 폴더 하나다. 폴더마다 routes.ts가 그 주소와 아래 주소를 정한다.
export const routes: Routes = [
  { path: "login", loadChildren: () => import("@/pages/login/routes") },
  { path: "onboarding", loadChildren: () => import("@/pages/onboarding/routes") },
  { path: "", loadChildren: () => import("@/pages/account/routes") },
  { path: "**", redirectTo: "" },
];
```

출처: [web/apps/accounts/src/pages/account/routes.ts](https://github.com/dev-goraebap/dev.goraebap/blob/9ab5efcb944c053f149d5f6cb5e12d1359ef9c7a/web/apps/accounts/src/pages/account/routes.ts)

```ts
// 로그인한 사람의 계정 화면. 이 폴더가 셸과 가드를 맡고, 아래 폴더가 각 주소의 화면을 맡는다.
export default [
  {
    path: "",
    canActivate: [signedIn],
    component: AccountShell,
    children: [
      { path: "", loadChildren: () => import("./home/routes") },
      { path: "profile", loadChildren: () => import("./profile/routes") },
      { path: "security", loadChildren: () => import("./security/routes") },
    ],
  },
] satisfies Routes;
```

`pages/account`의 라우트 파일이 레이아웃(셸)과 가드를 맡고, `profile`·`security` 폴더가 각 주소의 화면을 맡아 폴더 구조와 주소가 1:1로 맞습니다.
