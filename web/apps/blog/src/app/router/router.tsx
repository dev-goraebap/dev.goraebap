import {
  Link,
  createRouter,
  useCanGoBack,
  useRouter,
  type RouterHistory,
} from "@tanstack/react-router";
import { Button, buttonVariants } from "@goraebap/ui-react/components/button";
import { PageState } from "@/shared/ui";
import { routeTree } from "./routeTree.gen";

const hasPanel = (search: unknown) => Boolean((search as { panel?: unknown } | undefined)?.panel);

function RouteNotFound() {
  const router = useRouter();
  const canGoBack = useCanGoBack();

  return (
    <PageState
      kind="not-found"
      isFullScreen
      title="페이지를 찾을 수 없습니다"
      description="주소가 바뀌었거나 없는 문서입니다."
      action={
        <>
          {canGoBack && (
            <Button variant="outline" size="sm" onClick={() => router.history.back()}>
              이전으로
            </Button>
          )}
          <Link to="/" className={buttonVariants({ variant: canGoBack ? "default" : "outline", size: "sm" })}>
            처음으로
          </Link>
        </>
      }
    />
  );
}

function RouteError({ reset }: { reset: () => void }) {
  return (
    <PageState
      kind="error"
      isFullScreen
      title="화면을 불러오지 못했습니다"
      description="잠시 후 다시 시도해 주세요."
      action={
        <>
          <Button variant="default" size="sm" onClick={reset}>
            다시 시도
          </Button>
          <Link to="/" className={buttonVariants({ variant: "outline", size: "sm" })}>
            처음으로
          </Link>
        </>
      }
    />
  );
}

// 빌드 때 정적 페이지를 만드는 서버 렌더링은 메모리 기록을 넘겨 같은 라우터를 만든다.
export const createAppRouter = (history?: RouterHistory) =>
  createRouter({
    routeTree,
    history,
    scrollRestoration: true,
    // 같은 경로에서 모달(panel)만 열고 닫을 때만 페이지 전환 효과를 끈다.
    defaultViewTransition: {
      types: ({ fromLocation, toLocation }) => {
        const samePath = fromLocation?.pathname === toLocation.pathname;
        return samePath && (hasPanel(fromLocation?.search) || hasPanel(toLocation.search))
          ? false
          : ["page"];
      },
    },
    defaultPendingMs: 150,
    defaultNotFoundComponent: RouteNotFound,
    defaultErrorComponent: RouteError,
  });

export const router = createAppRouter();

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
