import { Link, Outlet, useRouter, useRouterState } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import { docAt, groupLabel } from '@/entities/document';
import { usePreferences } from '@/entities/preferences';
import { paths } from '@/shared/config/paths';
import { siteVersion } from '@/shared/config/site';
import { RocketMark } from '@/shared/loading/RocketMark';
import { AgentBar, AppShell, type NavEntry } from '@/shared/ui/app-shell';
import { BootCover } from '@/shared/ui/boot-cover';
import { Button } from '@/shared/ui/button';
import { SettingsIcon } from '@/shared/ui/icon';
import { Page, type Crumb } from '@/shared/ui/page';
import { useBlogTools } from './BlogTools';
import { AreaSwitch, Brand, Logo, type Area } from './Brand';
import { DocSearch } from './DocSearch';
import { blogSpace, guideSpace, settingsSpace } from './navigation';

/** 첫 방문 덮개를 첫 문서가 풀린 뒤 걷는다. 이후 전환에는 쓰지 않는다. */
function useFirstResolved() {
  const router = useRouter();
  const [isReady, setReady] = useState(router.state.status === 'idle' && router.state.matches.length > 0);
  useEffect(() => router.subscribe('onResolved', () => setReady(true)), [router]);
  return isReady;
}

/** 이 시간 안에 끝나는 이동에는 진행 표시를 띄우지 않는다. */
const SHOW_AFTER_MS = 150;
/** 한 번 띄운 진행 표시는 이만큼은 두어 깜빡이지 않게 한다. */
const KEEP_AT_LEAST_MS = 300;

/**
 * 화면 이동의 진행 표시(업무 앱의 RouteStage와 같은 규칙). 뼈대(스켈레톤)나 가리는 덮개를 두지 않는다: 다음 문서를 준비하는 동안
 * 지금 문서를 그대로 두고, 150ms가 지나면 콘텐츠 면 위쪽 테두리가 흐른다. 띄웠으면 최소 300ms 둔 뒤 내린다.
 * 준비된 문서끼리는 콘텐츠 영역만 View Transition으로 200ms 교차 페이드한다(app/main.tsx, app/styles/site.css).
 */
function useProgress() {
  const moving = useRouterState({ select: state => state.status === 'pending' && !!state.resolvedLocation && state.location.pathname !== state.resolvedLocation.pathname });
  const [shown, setShown] = useState(false);
  const shownAt = useRef(0);
  useEffect(() => {
    if (moving) {
      const timer = window.setTimeout(() => { shownAt.current = Date.now(); setShown(true); }, SHOW_AFTER_MS);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(() => setShown(false), Math.max(0, KEEP_AT_LEAST_MS - (Date.now() - shownAt.current)));
    return () => window.clearTimeout(timer);
  }, [moving]);
  return { moving, shown };
}

/** 휴대폰 하단 탭: 영역마다 자주 여는 곳. 나머지는 더보기에서 고른다. 탭은 좁으므로 괄호 속 한글명을 뗀다. */
const TAB_PATHS: Record<Area, string[]> = {
  settings: ['/settings/appearance/', '/settings/plugins/'],
  blog: ['/blog/', '/settings/appearance/'],
  webcraft: ['/webcraft/', '/webcraft/rules/goraebap-mode/', '/webcraft/rules/design-system/', '/webcraft/catalog/playground/'],
};
const settingsTab: NavEntry = { path: '/settings/appearance/', label: '설정', icon: SettingsIcon };

/** 사이드바 바닥: 설정 들어가기와 사이트 버전. 접히면 설정 아이콘만. */
function SidebarFooter({ isFolded }: { isFolded: boolean }) {
  if (isFolded) {
    return <Button variant="ghost" size="icon-sm" aria-label="설정" title="설정" nativeButton={false} render={<Link to={paths.appearance} />}><SettingsIcon /></Button>;
  }
  return <>
    <Button variant="ghost" size="sm" nativeButton={false} render={<Link to={paths.appearance} />}><SettingsIcon data-icon="inline-start" />설정</Button>
    <span className="px-1 font-mono text-[0.6875rem]">v{siteVersion}</span>
  </>;
}

/**
 * 사이트 셸: 키트 AppShell에 영역(Blog · Webcraft · 설정)의 메뉴를 데이터로 넘기고, Page에 경로와 목록 도구를 넣는다.
 * 사이드바 머리에 로고 · 영역 고르기 · 문서 찾기, 바닥에 설정 · 버전, 데스크톱 본문 아래에 Agent 줄을 둔다.
 * 휴대폰은 앱 바 오른쪽에 문서 찾기와 로고 · 영역 고르기, 아래에 하단 탭과 더보기가 온다.
 * 페이지 본문(page-body)의 점 무늬는 읽는 화면에 두지 않으므로 콘텐츠 자리가 페이지 면으로 덮는다.
 */
export function GuideShell() {
  const router = useRouter();
  const { layout } = usePreferences();
  const isReady = useFirstResolved();
  const progress = useProgress();
  const blogTools = useBlogTools();
  const pathname = useRouterState({ select: state => state.resolvedLocation?.pathname ?? state.location.pathname });
  const doc = docAt(pathname);
  const isBlogList = pathname === '/blog/';
  useEffect(() => { document.title = `${doc?.title ?? (isBlogList ? '모든 글' : '설정')} · dev-goraebap`; }, [doc, isBlogList]);
  const area: Area = pathname.startsWith('/settings/') ? 'settings' : pathname.startsWith('/blog/') ? 'blog' : 'webcraft';
  const space = area === 'settings' ? settingsSpace : area === 'blog' ? blogSpace : guideSpace;
  const groups = space.sections.flatMap(section => section.entries);
  const tabs = TAB_PATHS[area]
    .map(path => groups.find(entry => entry.path === path) ?? (path === settingsTab.path ? settingsTab : undefined))
    .filter((entry): entry is NavEntry => !!entry)
    .map(entry => ({ ...entry, label: entry.label.replace(/ \(.*\)$/, '') }));
  // 묶음 › 문서. 지침의 첫 장(묶음 주소와 같은 문서)과 첫 화면은 이름 하나만 둔다.
  const crumbs: Crumb[] = doc && doc.path !== '/webcraft/' && doc.path !== doc.group
    ? [{ label: groupLabel(doc.group), href: doc.group }, { label: doc.title }]
    : [{ label: doc ? (doc.path === doc.group && doc.path !== '/webcraft/' ? groupLabel(doc.group) : doc.title) : isBlogList ? '모든 글' : area === 'settings' ? (pathname.includes('/plugins') ? '플러그인' : '화면') : '없는 문서' }];
  return <>
    <AppShell space={space} pathname={pathname} tabs={tabs} openGroups="current" layout={layout}
      // 문서 사이트는 메뉴 이름이 길어(8.4.1 …) 처음부터 가장 넓게(380px) 연다.
      sidebarWidth={{ initial: 380, min: 220, max: 380 }}
      brand={isFolded => <Brand isFolded={isFolded} area={area} />}
      headerTools={<DocSearch />}
      footer={isFolded => <SidebarFooter isFolded={isFolded} />}
      bottomBar={<AgentBar onOpen={() => void router.navigate({ href: paths.plugins })} />}
      phoneTools={<><DocSearch size="icon" /><Logo /><AreaSwitch area={area} /></>}>
      {/* 긴 문서를 오갈 때 스크롤 막대가 생기고 사라지며 본문이 옆으로 흔들리지 않게 자리를 늘 둔다. */}
      <div className="contents **:data-[slot=page-body]:[scrollbar-gutter:stable]">
        <Page crumbs={crumbs} tools={isBlogList ? blogTools.tools : undefined} below={isBlogList ? blogTools.below : undefined}>
          <div className="relative isolate flex flex-1 flex-col bg-background" aria-busy={progress.moving || undefined}>
            {/* 늘 그려 두고 보이기만 바꾼다. 본문을 내려 읽는 중에도 보이도록 스크롤 맨 위에 붙인다. 화면 읽기 프로그램에는 상태 문구로 알린다. */}
            <div aria-hidden data-visible={progress.shown || undefined} data-route-progress={progress.shown ? '' : undefined}
              className="route-progress pointer-events-none sticky top-0 z-4 -mb-0.5 h-0.5 opacity-0 transition-opacity duration-240 data-visible:opacity-100 motion-reduce:transition-none" />
            <span className="sr-only" role="status" aria-live="polite">{progress.shown ? '다음 문서를 불러오는 중' : ''}</span>
            {/* 화면이 바뀔 때 교차 페이드하는 단위: 콘텐츠 영역 하나. 진행 표시 줄은 이 밖에 있어 그대로 움직인다. */}
            <div className="flex flex-1 flex-col [view-transition-name:guide-content]"><Outlet /></div>
          </div>
        </Page>
      </div>
    </AppShell>
    <BootCover isReady={isReady} mark={<RocketMark />} />
  </>;
}
