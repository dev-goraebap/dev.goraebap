import { EventCompose } from '../pages/calendar/EventCompose';
import { EventPage } from '../pages/calendar/EventPage';
import { DraftProvider } from '@kit/patterns/compose/draft-store';
import { useParams,useSearch } from '@tanstack/react-router';
import { Button } from '@astryxdesign/core/Button';
import { HStack } from '@astryxdesign/core/HStack';
import { LinkProvider } from '@astryxdesign/core/Link';
import { Text } from '@astryxdesign/core/Text';
import { PageState } from '@kit/composites/state/PageState';
import { icon } from '@kit/foundations/icons/solar-icon';
import { PlaygroundFrame as AppFrame } from '@samples/playground/PlaygroundFrame';
import type { NavSpace } from '@kit/layouts/app/nav';
import { Page } from '@kit/layouts/page/Page';
import { RouterLink } from '@kit/patterns/routing/RouterLink';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryHistory, createRootRoute, createRoute, createRouter, Outlet, RouterProvider, useLocation, useNavigate,
  type ErrorComponentProps } from '@tanstack/react-router';
import { useState } from 'react';
import { useShellLayout } from '../../../catalog/shell-layout';
import { EventApiContext, type EventApi } from '../entities/event';
import { createEventApi } from '../mocks/event-api';
import { CalendarPage } from '../pages/calendar/CalendarPage';

const space: NavSpace = {
  id: 'main', title: '일정', sections: [
    { title: '일정', isHeaderHidden: true, entries: [{ path: '/calendar', label: '일정', icon: 'calendar' }] },
  ],
};

function Shell() {
  const layout = useShellLayout();
  const location = useLocation();
  const navigate = useNavigate();
  return <LinkProvider component={RouterLink}>
    <AppFrame space={space} pathname={location.pathname} layout={layout} onNavigate={path => void navigate({ href: path })}
      brand={isFolded => <HStack gap={2} vAlign="center">{icon('calendar', true)}{isFolded ? null : <Text weight="semibold">일정</Text>}</HStack>}>
      <Outlet />
    </AppFrame>
  </LinkProvider>;
}

function RouteError({ reset }: ErrorComponentProps) {
  return <Page crumbs={[{ label: '일정' }]}>
    <PageState kind="error" title="화면을 열 수 없습니다" description="잠시 후 다시 시도해 주세요." action={<Button label="다시 시도" variant="secondary" onClick={reset} />} />
  </Page>;
}

function NotFound() {
  return <Page crumbs={[{ label: '일정', href: '/calendar' }, { label: '없는 페이지' }]} isDetail>
    <PageState kind="not-found" title="페이지를 찾을 수 없습니다" description="주소가 바뀌었거나 지워졌을 수 있습니다."
      action={<Button label="일정으로" variant="secondary" href="/calendar" />} />
  </Page>;
}

export function createCalendarRouter(initialPath: string) {
  const root = createRootRoute({ component: Shell, errorComponent: RouteError, notFoundComponent: NotFound });
  const calendar = createRoute({ getParentRoute: () => root, path: '/calendar', component: CalendarPage });
  const home = createRoute({ getParentRoute: () => root, path: '/', component: CalendarPage });
  const form=createRoute({getParentRoute:()=>root,path:'/calendar/new',component:FormRoute});
  const detail=createRoute({getParentRoute:()=>root,path:'/calendar/events/$id',component:EventPage});
  const edit=createRoute({getParentRoute:()=>root,path:'/calendar/events/$id/edit',component:FormRoute});
  return createRouter({ unmaskOnReload:true, routeTree: root.addChildren([home, calendar,form,detail,edit]), history: createMemoryHistory({ initialEntries: [initialPath] }) });
}

/** 일정 예제의 조립: 조회 캐시, 모의 저장소, 메모리 히스토리 라우터. 견본마다 새로 만든다. */
export function CalendarApp({ api, initialPath = '/calendar' }: { api?: EventApi; initialPath?: string }) {
  const [client] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } } }));
  const [repository] = useState(() => api ?? createEventApi());
  const [router] = useState(() => createCalendarRouter(initialPath));
  return <QueryClientProvider client={client}>
    <EventApiContext value={repository}><DraftProvider><RouterProvider router={router} /></DraftProvider></EventApiContext>
  </QueryClientProvider>;
}

function FormRoute(){const {id}=useParams({strict:false}) as {id?:string};const search=useSearch({strict:false}) as {date?:string};const navigate=useNavigate();return <EventCompose id={id} date={search.date as never} surface="page" onClose={()=>void navigate({href:'/calendar'})} onDone={next=>void navigate({href:`/calendar/events/${next}`,replace:true})}/>;}
