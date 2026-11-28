# 프로젝트 구성 (React · TanStack)

라이브러리 목록은 [표준 라이브러리](../../reference/standard-libraries/react-tanstack.md), 폴더 배치는 [디렉토리 구조](../../reference/directory-structure/react-tanstack.md)를 기준으로 삼습니다.

## 1. TypeScript와 경로 별칭 설정

`tsconfig.json`에 `strict` 모드와 `@/*` 경로 별칭을 설정합니다.

```json
{
  "compilerOptions": {
    "strict": true,
    "types": ["vite/client"],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src", "vite.config.ts"]
}
```

## 2. 표준 의존성 추가

[표준 라이브러리](../../reference/standard-libraries/react-tanstack.md)에 따라 React, Vite, TanStack Router, TanStack Query(API 연동 시), Tailwind CSS v4, 디자인 시스템 패키지를 설치합니다.

- 개발 의존성으로 `@tanstack/router-plugin`, `@vitejs/plugin-react`, `@tailwindcss/vite`, `eslint`, `prettier`, `knip`을 등록합니다.

## 3. Vite에 파일 라우팅 · Tailwind · 프록시 연결

`vite.config.ts`에서 TanStack Router 플러그인이 `src/pages`를 읽도록 연결하고, FSD 세그먼트를 라우트 스캔에서 제외합니다. 로컬 백엔드가 있다면 `server.proxy`도 함께 둡니다.

```ts
import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
      routesDirectory: "./src/pages",
      generatedRouteTree: "./src/app/router/routeTree.gen.ts",
      indexToken: "page",
      routeFileIgnorePattern: "^(ui|api|model|lib|config|index\\.ts)$",
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: false,
      },
    },
  },
});
```

## 4. 스타일과 앱 진입점 구성

1. `src/app/styles/index.css`에서 Tailwind CSS와 디자인 시스템 스타일을 불러옵니다.
2. `src/app/router/router.ts`에서 `routeTree.gen.ts`를 받아 라우터 인스턴스를 생성합니다.
3. `src/pages/__root.tsx`와 첫 화면 `src/pages/page.tsx`를 만듭니다.

## 5. 코드 품질 스크립트 등록

`package.json`에 타입 체크·린트·포맷·미사용 코드 검사 스크립트를 등록합니다.

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "typecheck": "tsc --noEmit",
    "lint": "eslint .",
    "format:check": "prettier --check .",
    "knip": "knip",
    "check": "pnpm lint && pnpm format:check && pnpm knip && pnpm typecheck && pnpm build"
  }
}
```

- ESLint·Prettier·Knip 설정에서 `src/app/router/routeTree.gen.ts`와 `dist/`를 제외합니다.

## 6. 동작 확인

```bash
pnpm check
pnpm dev
```

개발 서버가 뜨면 `src/app/router/routeTree.gen.ts`가 생성되고 첫 화면이 오류 없이 렌더링되는지 확인합니다.
