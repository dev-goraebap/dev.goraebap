import { Link, createRouter } from "@tanstack/react-router";
import { Button } from "@goraebap/ui-react/components/button";
import { PageState } from "@/shared/ui";
import { routeTree } from "./routeTree.gen";

const hasPanel = (search: unknown) => Boolean((search as { panel?: unknown } | undefined)?.panel);

function RouteNotFound() {
  return (
    <PageState
      kind="not-found"
      title="페이지를 찾을 수 없습니다"
      description="주소가 바뀌었거나 없는 문서입니다."
      action={
        <Button variant="outline" size="sm" nativeButton={false} render={<Link to="/" />}>
          처음으로
        </Button>
      }
    />
  );
}

function RouteError({ reset }: { reset: () => void }) {
  return (
    <PageState
      kind="error"
      title="화면을 불러오지 못했습니다"
      description="잠시 후 다시 시도해 주세요."
      action={
        <Button variant="outline" size="sm" onClick={reset}>
          다시 시도
        </Button>
      }
    />
  );
}

export const router = createRouter({
  routeTree,
  scrollRestoration: true,
  // 모달을 열고 닫을 때는 페이지 전환 효과를 쓰지 않는다.
  defaultViewTransition: {
    types: ({ fromLocation, toLocation }) =>
      hasPanel(fromLocation?.search) || hasPanel(toLocation.search) ? false : ["page"],
  },
  defaultPendingMs: 180,
  defaultNotFoundComponent: RouteNotFound,
  defaultErrorComponent: RouteError,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
