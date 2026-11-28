# 렌더링과 초기 로딩 (React · TanStack)

공통 렌더링 방식 선택과 초기 부트·지연 로딩 원칙은 [렌더링과 초기 로딩](index.md)을 따릅니다. React · TanStack 스택에서는 Vite 정적 빌드, 부트 게이트 컴포넌트, `preloadable` 래퍼로 구현합니다.

## 1. 초기 진입 부트 게이트 (`AppBootGate`)

`index.html`에 테마 선적용 스크립트와 인라인 스플래시 오버레이를 두고, React가 마운트된 뒤에는 `AppBootGate`가 초기 세션·권한 조회가 끝날 때까지 같은 모양의 스플래시를 이어받습니다.

```tsx
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { sessionOptions } from "@/entities/session";
import { BootErrorFallback, BootSplashScreen } from "@/shared/ui/boot-splash";

export function AppBootGate({ children }: { children: ReactNode }) {
  const { isPending, isError, refetch } = useQuery(sessionOptions());

  if (isPending) {
    return <BootSplashScreen />;
  }
  if (isError) {
    return <BootErrorFallback onRetry={() => void refetch()} />;
  }
  return <>{children}</>;
}
```

- 인증 만료(`401`)처럼 정상적으로 비로그인 상태가 확정된 경우는 오류가 아니라 로그인 라우트로 넘깁니다. 네트워크 오류나 `5xx`처럼 초기 상태를 판단할 수 없을 때만 `BootErrorFallback`을 표시합니다.
- 스플래시 최소 표시 시간(`300ms`)과 페이드아웃(`700ms`)은 `BootSplashScreen` 내부 타이머로 통일합니다.

## 2. `preloadable` 지연 로딩 래퍼

`React.lazy`는 모듈이 이미 네트워크로 내려와 있어도 최초 마운트 때 한 번 `Suspense`로 일시 정지합니다. `preload()`가 완료된 모듈을 메모리에 보관해 두고, 이미 로드된 경우 일반 컴포넌트처럼 바로 그리는 `preloadable` 래퍼를 씁니다.

```tsx
import { createElement, lazy, type ComponentType } from "react";

export function preloadable<P extends object>(load: () => Promise<ComponentType<P>>) {
  let loaded: ComponentType<P> | undefined;
  let pending: Promise<ComponentType<P>> | undefined;

  const preload = () => (pending ??= load().then((component) => (loaded = component)));
  const Lazy = lazy(() => preload().then((component) => ({ default: component })));

  function Preloadable(props: P) {
    return createElement((loaded ?? Lazy) as ComponentType<P>, props);
  }

  return Object.assign(Preloadable, { preload });
}
```

### 라우트 `loader`에서 코드와 데이터 병렬 준비

대형 에디터나 차트 컴포넌트를 사용하는 화면은 라우트 `loader`에서 데이터 조회와 컴포넌트 `preload()`를 `Promise.all`로 함께 실행합니다.

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { preloadable } from "@/shared/lib/preloadable";
import { itemDetailOptions } from "./api/items";
import { ItemDetailPage } from "./ui/ItemDetailPage";

export const RichEditor = preloadable(() =>
  import("@/shared/ui/rich-editor").then((mod) => mod.RichEditor),
);

export const Route = createFileRoute("/_app/items/$id/")({
  loader: ({ context, params }) =>
    Promise.all([
      context.queryClient.ensureQueryData({
        ...itemDetailOptions(params.id),
        staleTime: Infinity,
      }),
      RichEditor.preload(),
    ]),
  component: ItemDetailPage,
});
```

- 이렇게 준비하면 화면 전환이 완료된 직후 첫 프레임부터 `RichEditor`가 빈 자리나 `Suspense` 깜빡임 없이 바로 그려집니다.

## 3. SSG 공개 페이지

문서 사이트나 랜딩처럼 검색 노출이 필요한 앱은 Vite 빌드 파이프라인에 라우트별 정적 HTML 생성(프리렌더) 단계를 붙여 정적 파일 그대로 배포합니다. 앱 내부의 업무 화면은 CSR을 유지합니다.
