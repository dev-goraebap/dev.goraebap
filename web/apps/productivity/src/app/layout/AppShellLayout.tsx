import { RealtimeSync } from '@/features/realtime';
import { usePageLocation, usePendingPathname } from '@/shared/lib/route-location';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Suspense, useEffect, useState, useMemo } from 'react';
import { PanelLoading } from './PanelLoading';
import { derivedAvatar, drawnAvatarSource, useMemberPicture } from '@/shared/lib/avatar';
import { projectMembershipsOptions, projectOptions, projectsOptions } from '@/entities/project';
import { sendCommand } from '@/shared/api';
import { PushSync } from '@/features/push-device';
import { unreadNotificationsOptions } from '@/entities/notification';
import { useOpenPanel, usePanel } from '@/shared/lib/panel';
import { useIsMobile } from '@/shared/lib/use-mobile';
import { sessionOptions } from '@/shared/auth';
import { useAppearance } from '@/shared/lib/appearance';
import { crumbsOf, projectKeyOf } from '@/shared/config';
import { PageCrumbsProvider } from '@/shared/lib/page-crumbs';
import { AppFrame } from './AppFrame';
import { RouteStage } from './RouteStage';
import { useIntentPreload } from './use-intent-preload';
import { PanelHost } from './PanelHost';

/**
 * The signed-in app: the frame around the page in view, its menu the one the address belongs to (a project's titled with
 * its name), 받은 알림's box dotted while notices wait unread, 검색 opened from its box or Ctrl/⌘+K. A choice in a menu or the tabs goes to its address; 로그아웃 ends the session; a session found ended (a 401
 * anywhere) goes to the login.
 */
export function AppShellLayout() {
  useIntentPreload();
  const panel = usePanel();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const { pathname, searchStr } = usePageLocation();
  // 메뉴는 누른 곳을 바로 따른다(2026-11-15): 페이지는 읽을 것을 준비한 뒤에 바뀌지만, 사이드 메뉴(공간 · 고른 항목)는 가는
  // 주소의 것으로 먼저 바뀌어 공간을 바꿀 때 멈춘 듯 보이지 않는다. 페이지 머리와 본문은 준비된 주소를 그대로 따른다.
  const menuPathname = usePendingPathname() ?? pathname;
  const session = useQuery(sessionOptions()).data;
  const [initialUserId] = useState(session?.id);
  const picture = useMemberPicture(session?.id);
  const sessionChanged = !!session && session.id !== initialUserId;
  const { layout } = useAppearance();
  const key = projectKeyOf(menuPathname);
  const isSignedIn = !!session && !sessionChanged;
  const project = useQuery({ ...projectOptions(key ?? ''), enabled: isSignedIn && !!key });
  // 페이지 머리 경로는 준비된 주소를 따른다(메뉴는 누른 주소를 먼저 따른다). 프로젝트 안이면 첫 단계에 프로젝트 이름을 단다.
  const pageKey = projectKeyOf(pathname);
  const pageProject = useQuery({ ...projectOptions(pageKey ?? ''), enabled: isSignedIn && !!pageKey });
  const pageProjectName = pageProject.data?.name;
  const crumbs = useMemo(() => crumbsOf(pathname, pageProjectName), [pathname, pageProjectName]);
  const projects = useQuery({ ...projectsOptions(), enabled: isSignedIn });
  // 업무 메뉴에는 내가 멤버인 프로젝트를 프로젝트 목록의 순서로 둔다(Linear의 Your teams, 2026-11-14).
  const memberships = useQuery({ ...projectMembershipsOptions(), enabled: isSignedIn });
  const myProjects = (projects.data ?? []).filter(each => (memberships.data ?? []).some(m => m.projectId === each.id && m.userId === session?.id));
  // 업무 · 문서의 보기(뷰)는 메뉴에 두지 않는다(2026-11-14): 페이지의 보기 알약에서만 바꾼다.
  const unread = useQuery({ ...unreadNotificationsOptions(), enabled: isSignedIn }).data?.count ?? 0;
  const openPanel = useOpenPanel();
  // Ctrl/⌘+K opens 검색 wherever one is, as Linear's.
  useEffect(() => {
    const press = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k' && !event.isComposing) { event.preventDefault(); openPanel('/search'); }
    };
    window.addEventListener('keydown', press);
    return () => window.removeEventListener('keydown', press);
  }, [openPanel]);
  useEffect(() => {
    const ended = () => { void queryClient.invalidateQueries({ queryKey: sessionOptions().queryKey }); };
    window.addEventListener('session-expired', ended);
    return () => window.removeEventListener('session-expired', ended);
  }, [queryClient]);
  useEffect(() => {
    if (session === null) window.location.replace('/login');
    else if (sessionChanged) window.location.reload();
  }, [session, sessionChanged]);
  if (!session || sessionChanged) return null;
  const logout = async () => {
    await sendCommand('/api/v1/auth/logout', 'POST');
    window.location.replace('/login');
  };
  return <AppFrame pathname={menuPathname} search={searchStr} myProjects={myProjects}
    onCreateProject={(session.roles ?? []).includes('WORKSPACE_ADMIN') ? () => openPanel('/workspace/projects/new') : undefined} layout={layout} projectName={project.data?.name} roles={session.roles ?? []} version={__APP_VERSION__}
    unread={unread} onSearch={() => openPanel('/search')}
    me={{ name: session.name ?? '', team: session.email ?? '', picture, fallbackPicture: drawnAvatarSource(derivedAvatar(session.id ?? '')) }}
    onLogout={() => void logout()}>
    <RealtimeSync userId={session.id} />
    <PageCrumbsProvider value={crumbs}><RouteStage /></PageCrumbsProvider>
    {/* 이 페이지 위에 대화상자로 연 페이지(새 업무, 새 일정, 검색). 대화상자는 그려진 쪽(DetailSurface · FormDialog …)이
        저마다 띄운다. 휴대폰은 PanelHost가 그 페이지로 옮기므로 기다리는 자리를 띄우지 않는다. */}
    <Suspense fallback={panel.href && !isMobile ? <PanelLoading href={panel.href} onClose={panel.close} /> : null}>
      <PanelHost />
    </Suspense>
    {/* This device's push: moved to the member signed in, and a pressed notification opening its page. */}
    <PushSync />
  </AppFrame>;
}
