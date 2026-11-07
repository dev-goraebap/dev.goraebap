import { useRef, useState, type CSSProperties, type ReactNode } from "react";
import { ResizeHandle, useResizable } from "@astryxdesign/core/Resizable";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
  useLocation,
  useNavigate,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import {
  collections,
  ResourceApiContext,
  type ResourceApi,
} from "../entities/resource";
import { LibraryPage, validateLibrarySearch } from "../pages/library";
import { ResourceDetailPage } from "../pages/resource-detail";
import {
  ResourceCreatePage,
  ResourceDraftProvider,
} from "../pages/resource-create";
import {
  Button,
  DropdownMenu,
  Icon,
  ReferenceTheme,
  useOpenPanel,
  useRoutedPanel,
} from "../shared/ui";
import { createResourceApi } from "../mocks/resource-api";
import "../../../foundations/styles.css";

function Shell({
  initialTheme = "light",
  initialLayout = "inset",
  persistSidebar = false,
}: {
  initialTheme?: "light" | "dark";
  initialLayout?: "inset" | "split";
  persistSidebar?: boolean;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const search = validateLibrarySearch(location.search);
  const [mode, setMode] = useState(initialTheme);
  const [layout, setLayout] = useState(initialLayout);
  const sidebar = useResizable({
    defaultSize: 340,
    minSizePx: 220,
    maxSizePx: 380,
    collapsible: true,
    collapsedSize: 160,
    autoSaveId: persistSidebar ? "goraebap-library-sidebar" : undefined,
  });
  const toggleRef = useRef<HTMLButtonElement>(null);
  const sidebarToggle = (
    <Button
      ref={toggleRef}
      label={sidebar.isCollapsed ? "메뉴 펼치기" : "메뉴 접기"}
      tooltip={sidebar.isCollapsed ? "메뉴 펼치기" : "메뉴 접기"}
      variant="ghost"
      isIconOnly
      icon={<Icon name="sidebar" />}
      onClick={() => {
        sidebar.isCollapsed ? sidebar.expand() : sidebar.collapse();
        requestAnimationFrame(() =>
          toggleRef.current?.focus({ preventScroll: true }),
        );
      }}
    />
  );
  const go = (next: Record<string, unknown>) =>
    void navigate({ to: "/resources", search: next });
  const nav = (
    label: string,
    icon: "library" | "star" | "folder",
    selected: boolean,
    next: Record<string, unknown>,
    extra?: ReactNode,
  ) => (
    <a
      href={`/resources?${new URLSearchParams(Object.entries(next).map(([key, value]) => [key, String(value)]))}`}
      className="library-nav-item"
      aria-label={label}
      title={label}
      aria-current={selected ? "page" : undefined}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey) return;
        event.preventDefault();
        go(next);
      }}
    >
      <Icon name={icon} selected={selected} />
      <span>{label}</span>
      {extra}
    </a>
  );
  return (
    <ReferenceTheme mode={mode}>
      <div
        className="library-app"
        data-layout={layout}
        data-sidebar-collapsed={sidebar.isCollapsed || undefined}
        style={
          {
            "--library-sidebar-width": `${sidebar.isCollapsed ? 64 : sidebar.size}px`,
          } as CSSProperties
        }
        data-detail={
          !["/", "/resources"].includes(location.pathname) || undefined
        }
      >
        <aside className="library-sidebar" aria-label="사이드바">
          <div className="library-brand-row">
            <a
              className="library-brand"
              aria-label="서가 홈"
              href="/resources"
              onClick={(event) => {
                event.preventDefault();
                go({});
              }}
            >
              <span className="library-brand-icon">
                <Icon name="library" size={23} />
              </span>
              <strong>서가</strong>
            </a>
            {!sidebar.isCollapsed && sidebarToggle}
          </div>
          <nav className="library-primary-nav" aria-label="주 탐색">
            {nav(
              "모든 자료",
              "library",
              !search.collection && !search.starred,
              {},
            )}
            {nav("즐겨찾기", "star", !!search.starred, { starred: true })}
            <h2>컬렉션</h2>
            {collections.map((item) => (
              <div key={item.id}>
                {nav(
                  item.name,
                  "folder",
                  search.collection === item.id,
                  { collection: item.id },
                  <span
                    className={`library-color-dot library-color-dot--${item.color}`}
                  />,
                )}
              </div>
            ))}
          </nav>
          <div className="library-sidebar-bottom">
            <div className="library-preferences">
              <Button
                label={mode === "light" ? "다크 모드" : "라이트 모드"}
                isIconOnly={sidebar.isCollapsed}
                icon={<Icon name={mode === "light" ? "moon" : "sun"} />}
                variant="ghost"
                onClick={() => setMode(mode === "light" ? "dark" : "light")}
              />
              <Button
                className="library-layout-toggle"
                label={layout === "inset" ? "Split 레이아웃" : "Inset 레이아웃"}
                isIconOnly
                icon={<Icon name="grid" />}
                variant="ghost"
                onClick={() =>
                  setLayout(layout === "inset" ? "split" : "inset")
                }
              />
            </div>
            <div className="library-profile">
              <span className="library-avatar">서</span>
              <div>
                <strong>서윤의 서가</strong>
                <span>개인 라이브러리</span>
              </div>
            </div>
          </div>
          {sidebar.isCollapsed && (
            <div className="library-sidebar-expand">{sidebarToggle}</div>
          )}
          {!sidebar.isCollapsed && (
            <ResizeHandle
              label="사이드바 너비 조절"
              position="overlay"
              pillPlacement="center"
              isAlwaysVisible={false}
              resizable={sidebar.props}
            />
          )}
        </aside>
        <main className="library-main">
          <Outlet />
        </main>
        <nav className="library-mobile-nav" aria-label="모바일 탐색">
          {nav(
            "모든 자료",
            "library",
            !search.collection && !search.starred,
            {},
          )}
          {nav("즐겨찾기", "star", !!search.starred, { starred: true })}
          <DropdownMenu
            placement="above"
            hasChevron={false}
            button={{
              label: "컬렉션",
              variant: "ghost",
              className: "library-mobile-collection-trigger",
              children: (
                <span className="library-mobile-tab">
                  <Icon name="folder" size={24} />
                  <span>컬렉션</span>
                </span>
              ),
            }}
            items={collections.map((item) => ({
              label: item.name,
              icon: (
                <Icon name="folder" selected={search.collection === item.id} />
              ),
              selected: search.collection === item.id,
              onClick: () => go({ collection: item.id }),
            }))}
          />
          <Button
            label={mode === "light" ? "다크 모드" : "라이트 모드"}
            isIconOnly
            icon={<Icon name={mode === "light" ? "moon" : "sun"} />}
            variant="ghost"
            onClick={() => setMode(mode === "light" ? "dark" : "light")}
          />
        </nav>
      </div>
    </ReferenceTheme>
  );
}
function ResourceListRoute() {
  const open = useOpenPanel();
  const panel = useRoutedPanel();
  const navigate = useNavigate();
  return (
    <>
      <LibraryPage
        onOpen={(id) => open(`/resources/${id}`)}
        onCreate={() => open("/resources/new")}
      />
      {panel.href &&
        (panel.href === "/resources/new" ? (
          <ResourceCreatePage
            surface="dialog"
            onClose={panel.close}
            onExpand={panel.expand}
            onCreated={(id) =>
              void navigate({ href: `/resources/${id}`, replace: true })
            }
          />
        ) : (
          <ResourceDetailPage
            id={panel.href.split("/").at(-1)!}
            surface="dialog"
            onClose={panel.close}
            onExpand={panel.expand}
          />
        ))}
    </>
  );
}
function ResourceDetailRoute() {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <ResourceDetailPage
      id={location.pathname.split("/").at(-1)!}
      onClose={() => void navigate({ href: "/resources" })}
    />
  );
}
function ResourceCreateRoute() {
  const navigate = useNavigate();
  return (
    <ResourceCreatePage
      onClose={() => void navigate({ href: "/resources" })}
      onCreated={(id) =>
        void navigate({ href: `/resources/${id}`, replace: true })
      }
    />
  );
}
function RouterFallback({ error, reset }: ErrorComponentProps) {
  return (
    <div className="library-empty" role="alert">
      <h1>화면을 열 수 없습니다</h1>
      <p>
        {error instanceof Error ? error.message : "잠시 후 다시 시도해주세요."}
      </p>
      <Button label="다시 시도" onClick={() => reset()} />
    </div>
  );
}
export function createLibraryRouter(
  initialPath?: string,
  initialTheme?: "light" | "dark",
  initialLayout?: "inset" | "split",
) {
  const root = createRootRoute({
    component: () => (
      <Shell
        initialTheme={initialTheme}
        initialLayout={initialLayout}
        persistSidebar={false}
      />
    ),
    errorComponent: RouterFallback,
    notFoundComponent: () => (
      <div className="library-empty">
        <h1>페이지를 찾을 수 없습니다</h1>
        <a href="/resources">자료 목록으로</a>
      </div>
    ),
  });
  const home = createRoute({
    getParentRoute: () => root,
    path: "/",
    component: ResourceListRoute,
    validateSearch: validateLibrarySearch,
  });
  const list = createRoute({
    getParentRoute: () => root,
    path: "/resources",
    component: ResourceListRoute,
    validateSearch: validateLibrarySearch,
  });
  const create = createRoute({
    getParentRoute: () => root,
    path: "/resources/new",
    component: ResourceCreateRoute,
  });
  const detail = createRoute({
    getParentRoute: () => root,
    path: "/resources/$id",
    component: ResourceDetailRoute,
  });
  return createRouter({
    routeTree: root.addChildren([home, list, create, detail]),
    history: createMemoryHistory({
      initialEntries: [initialPath ?? "/resources"],
    }),
    unmaskOnReload: true,
    defaultPreload: "intent",
    scrollRestoration: true,
  });
}
export function LibraryApp({
  api,
  initialPath,
  initialTheme,
  initialLayout,
}: {
  api?: ResourceApi;
  initialPath?: string;
  initialTheme?: "light" | "dark";
  initialLayout?: "inset" | "split";
}) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: false, refetchOnWindowFocus: false },
        },
      }),
  );
  const [repository] = useState(() => api ?? createResourceApi());
  const [router] = useState(() =>
    createLibraryRouter(initialPath, initialTheme, initialLayout),
  );
  return (
    <QueryClientProvider client={client}>
      <ResourceApiContext value={repository}>
        <ResourceDraftProvider>
          <RouterProvider router={router} />
        </ResourceDraftProvider>
      </ResourceApiContext>
    </QueryClientProvider>
  );
}
