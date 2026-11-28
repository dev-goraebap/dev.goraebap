# 프로젝트 구성 (Angular)

라이브러리 목록은 [표준 라이브러리](../../reference/standard-libraries/angular.md), 폴더 배치는 [디렉토리 구조](../../reference/directory-structure/angular.md)를 기준으로 삼습니다.

## 1. TypeScript · Angular Strict · 경로 별칭 설정

`tsconfig.json`에 TypeScript `strict` 옵션, Angular 템플릿 엄격 검사, `@/*` 별칭을 함께 켭니다.

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "isolatedModules": true,
    "target": "ES2022",
    "module": "preserve",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "angularCompilerOptions": {
    "enableI18nLegacyMessageIdFormat": false,
    "strictInjectionParameters": true,
    "strictInputAccessModifiers": true,
    "strictTemplates": true
  }
}
```

## 2. 표준 의존성과 Tailwind CSS 연결

1. [표준 라이브러리](../../reference/standard-libraries/angular.md)에 따라 `@angular/core`, `@angular/router`, `@angular/common`, `@angular/cdk`, `@angular/aria`, Tailwind CSS v4(`tailwindcss`, `@tailwindcss/postcss`), 디자인 시스템 패키지를 설치합니다.
2. `.postcssrc.json`에 `@tailwindcss/postcss` 플러그인을 등록하고 `src/styles.css`에서 Tailwind CSS와 디자인 토큰을 불러옵니다.

```json
{
  "plugins": {
    "@tailwindcss/postcss": {}
  }
}
```

## 3. 앱 프로바이더와 `pages/` 라우팅 연결

`src/app/app.config.ts`에 `HttpClient(withFetch())`와 `Router` 기능을 등록합니다.

```ts
// src/app/app.config.ts
import { provideHttpClient, withFetch } from "@angular/common/http";
import { type ApplicationConfig, provideBrowserGlobalErrorListeners } from "@angular/core";
import { provideRouter, withComponentInputBinding, withViewTransitions } from "@angular/router";
import { routes } from "./app.routes";

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideHttpClient(withFetch()),
    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),
  ],
};
```

`src/app/app.routes.ts`에서 최상위 `pages/<slice>/routes.ts`를 `loadChildren`으로 연결합니다.

```ts
// src/app/app.routes.ts
import type { Routes } from "@angular/router";

export const routes: Routes = [
  { path: "login", loadChildren: () => import("@/pages/login/routes") },
  { path: "", loadChildren: () => import("@/pages/workspace/routes") },
  { path: "**", redirectTo: "" },
];
```

## 4. API 프록시 설정

루트에 `proxy.conf.json`을 두고 개발 서버 실행 스크립트에 연결합니다.

```json
{
  "/api": {
    "target": "http://localhost:8080",
    "secure": false,
    "changeOrigin": false
  }
}
```

## 5. 품질 검사 스크립트 등록

`package.json`에 개발 서버, 프로덕션 빌드, 타입 체크 스크립트를 등록합니다.

```json
{
  "scripts": {
    "dev": "ng serve --port 5174 --proxy-config proxy.conf.json",
    "build": "ng build",
    "typecheck": "tsc -p tsconfig.app.json --noEmit"
  }
}
```

## 6. 동작 확인

```bash
pnpm typecheck
pnpm build
pnpm dev
```

개발 서버가 뜨면 라우트 전환, 디자인 토큰 적용, `/api` 프록시 응답이 정상 동작하는지 확인합니다.
