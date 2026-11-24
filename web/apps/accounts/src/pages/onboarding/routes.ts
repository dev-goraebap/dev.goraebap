import { inject } from "@angular/core";
import { RedirectCommand, type ResolveFn, Router, type Routes } from "@angular/router";
import { SessionApi, type AuthMe } from "@/entities/session";
import { ServerState } from "@/shared/lib/server-state";
import { OnboardingPage } from "./ui/onboarding-page";

// 화면과 같은 조회 옵션(SessionApi.me)으로 미리 읽는다. 로그인하지 않았으면 로그인으로 보낸다.
// inject는 await 앞에서만 쓸 수 있어 먼저 꺼내 둔다.
const me: ResolveFn<AuthMe> = async () => {
  const router = inject(Router);
  const value = await inject(ServerState).ensure(inject(SessionApi).me);
  return value ?? new RedirectCommand(router.parseUrl("/login"));
};

export default [
  { path: "", resolve: { me }, component: OnboardingPage, title: "처음 설정 · goraebap accounts" },
] satisfies Routes;
