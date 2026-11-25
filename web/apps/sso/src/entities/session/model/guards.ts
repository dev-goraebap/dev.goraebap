import { inject } from "@angular/core";
import { type CanActivateFn, Router } from "@angular/router";
import { ServerState } from "@/shared/lib/server-state";
import { SessionApi } from "../api/session";

// 계정 화면: 로그인하지 않았으면 로그인으로, 첫 설정 전이면 온보딩으로 보낸다.
export const signedIn: CanActivateFn = async (_route, state) => {
  const router = inject(Router);
  const me = await inject(ServerState).ensure(inject(SessionApi).me);
  if (!me) return router.createUrlTree(["/login"], { queryParams: { next: state.url } });
  if (!me.onboarded) return router.createUrlTree(["/onboarding"]);
  return true;
};

// 로그인 화면: 이미 로그인했으면 계정 홈으로 보낸다. next가 있으면 로그인 화면이 직접 처리한다.
export const signedOut: CanActivateFn = async (route) => {
  const router = inject(Router);
  const me = await inject(ServerState).ensure(inject(SessionApi).me);
  if (me?.onboarded && !route.queryParamMap.has("next")) return router.createUrlTree(["/"]);
  return true;
};
