# 페이지 전환과 대기 (angular)

공통 규칙은 [index.md](index.md)에 있습니다.

## router-setup

Angular Router에 View Transitions API를 켜고, resolver가 캐시를 먼저 확인해 선조회합니다. 데이터가 준비되기 전까지 이전 화면이 유지됩니다.

```ts
import { provideRouter, withViewTransitions } from "@angular/router";

// 1. 라우터에 View Transitions API 활성화
export const appConfig = {
  providers: [provideRouter(routes, withViewTransitions())],
};

// 2. ResolveFn에서 캐시 확인 후 데이터 선조회 (완료 전까지 이전 화면 유지)
export const projectResolver: ResolveFn<Project> = (route) => {
  const store = inject(ProjectCacheService);
  return store.getOrFetch(route.paramMap.get("id")!);
};

// 3. NavigationStart 뒤 150ms 타이머로 화면 맨 위 진행 막대를 띄우고, 한 번 띄웠으면 최소 300ms 둔 뒤 NavigationEnd에서 내린다
```
