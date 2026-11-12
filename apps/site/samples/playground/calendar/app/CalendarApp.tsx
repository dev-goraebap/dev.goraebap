import { DraftProvider } from '@/shared/lib/draft';
import type { NavSpace } from '@/shared/ui/app-shell';
import { Button } from '@/shared/ui/button';
import { CalendarIcon } from '@/shared/ui/icon';
import { Page } from '@/shared/ui/page';
import { PageState } from '@/shared/ui/page-state';
import { PlaygroundShell } from '@samples/playground/PlaygroundShell';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryHistory, createRootRoute, createRoute, createRouter, Link, Outlet, RouterProvider, useLocation, useNavigate, useParams, useSearch,
  type ErrorComponentProps } from '@tanstack/react-router';
import { useState } from 'react';
import { useShellLayout } from '../../../catalog/shell-layout';
import { EventApiContext, type DateKey, type EventApi } from '../entities/event';
import { createEventApi } from '../mocks/event-api';
import { CalendarPage } from '../pages/calendar/CalendarPage';
import { EventCompose } from '../pages/calendar/EventCompose';
import { EventPage } from '../pages/calendar/EventPage';

/** 라우터 주소의 타입은 사이트 라우터에 등록되어 있어, 견본 앱의 주소는 글자로 넘긴다. */
const HOME: string = '/calendar';

const space: NavSpace = {
  id: 'main', title: '일정', sections: [
    { title: '일정', isHeaderHidden: true, entries: [{ path: '/calendar', label: '일정', icon: CalendarIcon }] },
  ],
};

function Shell() {
  const layout = useShellLayout();
  const location = useLocation();
  return (
    <PlaygroundShell space={space} pathname={location.pathname} layout={layout}
      brand={isFolded => <span className="flex min-w-0 items-center gap-2"><CalendarIcon chosen className="size-5 shrink-0" />{isFolded ? null : <span className="truncate font-semibold">일정</span>}</span>}>
      <Outlet />
    </PlaygroundShell>
  );
}

function RouteError({ reset }: ErrorComponentProps) {
  return (
    <Page crumbs={[{ label: '일정' }]}>
      <PageState kind="error" title="화면을 열 수 없습니다" description="잠시 후 다시 시도해 주세요." action={<Button variant="secondary" onClick={reset}>다시 시도</Button>} />
    </Page>
  );
}

function NotFound() {
  return (
    <Page crumbs={[{ label: '일정', href: HOME }, { label: '없는 페이지' }]} isFullScreen>
      <PageState kind="not-found" title="페이지를 찾을 수 없습니다" description="주소가 바뀌었거나 지워졌을 수 있습니다."
        action={<Button variant="secondary" nativeButton={false} render={<Link to={HOME} />}>일정으로</Button>} />
    </Page>
  );
}

/** 작성 · 수정의 자기 페이지(새로고침 · 크게 보기 · 휴대폰). 저장하면 그 일정의 상세로 간다. */
function FormRoute() {
  const { id } = useParams({ strict: false }) as { id?: string };
  const search = useSearch({ strict: false }) as { date?: unknown };
  const navigate = useNavigate();
  return <EventCompose id={id} date={typeof search.date === 'string' ? search.date as DateKey : undefined} surface="page"
    onClose={() => void navigate({ href: HOME })} onDone={next => void navigate({ href: `/calendar/events/${next}`, replace: true })} />;
}

export function createCalendarRouter(initialPath: string) {
  const root = createRootRoute({ component: Shell, errorComponent: RouteError, notFoundComponent: NotFound });
  const calendar = createRoute({ getParentRoute: () => root, path: '/calendar', component: CalendarPage });
  const home = createRoute({ getParentRoute: () => root, path: '/', component: CalendarPage });
  const form = createRoute({ getParentRoute: () => root, path: '/calendar/new', component: FormRoute });
  const detail = createRoute({ getParentRoute: () => root, path: '/calendar/events/$id', component: EventPage });
  const edit = createRoute({ getParentRoute: () => root, path: '/calendar/events/$id/edit', component: FormRoute });
  return createRouter({ routeTree: root.addChildren([home, calendar, form, detail, edit]), history: createMemoryHistory({ initialEntries: [initialPath] }) });
}

/** 일정 예제의 조립: 조회 캐시, 모의 저장소, 라우터보다 위의 초안 경계, 메모리 히스토리 라우터. 견본마다 새로 만든다. */
export function CalendarApp({ api, initialPath = '/calendar' }: { api?: EventApi; initialPath?: string }) {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } } }));
  const [repository] = useState(() => api ?? createEventApi());
  const [router] = useState(() => createCalendarRouter(initialPath));
  return (
    <QueryClientProvider client={client}>
      <EventApiContext value={repository}><DraftProvider><RouterProvider router={router} /></DraftProvider></EventApiContext>
    </QueryClientProvider>
  );
}
