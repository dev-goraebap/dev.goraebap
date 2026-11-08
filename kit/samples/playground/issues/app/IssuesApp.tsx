import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { LinkProvider } from '@astryxdesign/core/Link';
import { Text } from '@astryxdesign/core/Text';
import { PageState } from '@kit/composites/state/PageState';
import { icon } from '@kit/foundations/icons/solar-icon';
import { AppFrame } from '@kit/layouts/app/AppFrame';
import type { NavSpace } from '@kit/layouts/app/nav';
import { Page } from '@kit/layouts/page/Page';
import { DraftProvider } from '@kit/patterns/compose/draft-store';
import { RouterLink } from '@kit/patterns/routing/RouterLink';
import { useOpenPanel, useRoutedPanel } from '@kit/patterns/routing/routed-panel';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryHistory, createRootRoute, createRoute, createRouter, Outlet, RouterProvider, useLocation, useNavigate, useParams, useSearch,
  type ErrorComponentProps } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { IssueApiContext, me, type IssueApi } from '../entities/issue';
import { createIssueApi } from '../mocks/issue-api';
import { IssueCompose } from '../pages/issue-compose/IssueCompose';
import { IssueDetailPage } from '../pages/issue-detail/IssueDetailPage';
import { IssuesPage } from '../pages/issues/IssuesPage';
import { validateIssuesSearch } from '../pages/issues/model';
import { useShellLayout } from '../../../catalog/shell-layout';
import styles from './app.module.css';

const space: NavSpace = {
  id: 'main', title: '이슈', sections: [{ title: '이슈', isHeaderHidden: true, entries: [
    { path: '/issues', label: '모든 이슈', icon: 'tag' },
    { path: `/issues?assignee=${me}`, label: '내 이슈', icon: 'user' },
  ] }],
};

/** 셸: 주소가 메뉴의 현재 항목을 정한다. 담당자로 나뉜 항목은 조건까지 비교한다. */
function Shell() {
  const layout = useShellLayout();
  const location = useLocation();
  const navigate = useNavigate();
  const search = location.search as Record<string, unknown>;
  const isSelected = (path: string) => {
    const [base, query] = path.split('?');
    if (!location.pathname.startsWith(base)) return false;
    if (!query) return !search.assignee;
    return [...new URLSearchParams(query)].every(([key, value]) => String(search[key]) === value);
  };
  return <LinkProvider component={RouterLink}>
    <AppFrame space={space} pathname={location.pathname} isSelected={isSelected} layout={layout}
      onNavigate={path => void navigate({ href: path })}
      brand={isFolded => <a className={styles.brand} href="/issues" aria-label="이슈 처음으로" onClick={event => { event.preventDefault(); void navigate({ href: '/issues' }); }}>
        <HStack gap={2} vAlign="center">{icon('tag', true)}{isFolded ? null : <Text weight="semibold">이슈</Text>}</HStack>
      </a>}>
      <Outlet />
    </AppFrame>
  </LinkProvider>;
}

/** 목록과 목록 위의 작성 대화상자. 휴대폰 폭에서 ?panel이 남아 있으면 그 페이지로 옮긴다. */
function ListRoute() {
  const open = useOpenPanel();
  const panel = useRoutedPanel();
  const navigate = useNavigate();
  useEffect(() => { if (panel.pendingPhoneHref) void navigate({ href: panel.pendingPhoneHref, replace: true }); }, [panel.pendingPhoneHref, navigate]);
  const edit = panel.href?.match(/^\/issues\/([^/]+)\/edit$/)?.[1];
  return <>
    <IssuesPage onCreate={() => open('/issues/new')} />
    {panel.href === '/issues/new' || edit
      ? <IssueCompose key={panel.href} id={edit} surface="dialog" onClose={panel.close} onExpand={panel.expand} onDone={id => panel.done(`/issues/${id}`)} />
      : null}
  </>;
}

function DetailRoute() {
  const { id } = useParams({ strict: false }) as { id: string };
  const navigate = useNavigate();
  return <IssueDetailPage id={id} onEdit={() => void navigate({ href: `/issues/${id}/edit` })} onAddSub={() => void navigate({ href: `/issues/new?parent=${id}` })} />;
}

function ComposeRoute() {
  const { id } = useParams({ strict: false }) as { id?: string };
  const { parent } = useSearch({ strict: false }) as { parent?: string };
  const navigate = useNavigate();
  return <IssueCompose id={id} parent={parent} surface="page" onClose={() => void navigate({ href: id ? `/issues/${id}` : parent ? `/issues/${parent}` : '/issues' })}
    onDone={next => void navigate({ href: `/issues/${next}`, replace: true })} />;
}

function RouteError({ reset }: ErrorComponentProps) {
  return <Page crumbs={[{ label: '이슈' }]}>
    <PageState kind="error" title="화면을 열 수 없습니다" description="잠시 후 다시 시도해 주세요." action={<Button label="다시 시도" variant="secondary" onClick={reset} />} />
  </Page>;
}

function NotFound() {
  return <Page crumbs={[{ label: '이슈', href: '/issues' }, { label: '없는 페이지' }]} isDetail>
    <PageState kind="not-found" title="페이지를 찾을 수 없습니다" description="주소가 바뀌었거나 지워졌을 수 있습니다."
      action={<Button label="이슈 목록으로" variant="secondary" href="/issues" />} />
  </Page>;
}

export function createIssuesRouter(initialPath: string) {
  const root = createRootRoute({ component: Shell, errorComponent: RouteError, notFoundComponent: NotFound });
  const list = createRoute({ getParentRoute: () => root, path: '/issues', component: ListRoute, validateSearch: validateIssuesSearch });
  const home = createRoute({ getParentRoute: () => root, path: '/', component: ListRoute, validateSearch: validateIssuesSearch });
  const create = createRoute({ getParentRoute: () => root, path: '/issues/new', component: ComposeRoute,
    validateSearch: (raw: Record<string, unknown>) => ({ parent: typeof raw.parent === 'string' && /^ISS-\d+$/.test(raw.parent) ? raw.parent : undefined }) });
  const detail = createRoute({ getParentRoute: () => root, path: '/issues/$id', component: DetailRoute });
  const edit = createRoute({ getParentRoute: () => root, path: '/issues/$id/edit', component: ComposeRoute });
  return createRouter({
    routeTree: root.addChildren([home, list, create, detail, edit]),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
    unmaskOnReload: true, defaultPreload: 'intent', scrollRestoration: true,
  });
}

/**
 * 이슈 앱의 조립: 조회 캐시, 모의 저장소, 라우터보다 위의 초안 경계. 견본마다 새로 만들며 메모리 히스토리를 쓴다. 테마와 셸 배치는
 * 가이드 머리 줄이 정한다.
 */
export function IssuesApp({ api, initialPath = '/issues' }: { api?: IssueApi; initialPath?: string }) {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } } }));
  const [repository] = useState(() => api ?? createIssueApi({ delay: 60 }));
  const [router] = useState(() => createIssuesRouter(initialPath));
  return <QueryClientProvider client={client}>
    <IssueApiContext value={repository}>
      <DraftProvider><RouterProvider router={router} /></DraftProvider>
    </IssueApiContext>
  </QueryClientProvider>;
}
