import { Selector } from '@astryxdesign/core/Selector';
import logo from '@/shared/ui/foundations/brand/logo.svg?raw';
import { Button } from '@astryxdesign/core/Button';
import { usePreferences } from '@/entities/preferences';
import { siteVersion } from '@/shared/config/site';
import { BlogTools } from './BlogTools';
import { AgentBar } from './AgentBar';
import shell from './shell.module.css';
import { guideSpace, blogSpace, settingsSpace } from './navigation';
import { CommandPalette } from '@astryxdesign/core/CommandPalette';
import { LinkProvider } from '@astryxdesign/core/Link';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Text } from '@astryxdesign/core/Text';
import { createStaticSource } from '@astryxdesign/core/Typeahead';
import { icon } from '@/shared/ui/foundations/icons/solar-icon';
import { ReferenceTheme } from '@/shared/ui/foundations/ReferenceTheme';
import { useIsPhone } from '@/shared/ui/foundations/media';
import { AppFrame } from '@/shared/ui/layouts/app/AppFrame';
import { Page } from '@/shared/ui/layouts/page/Page';
import { BootCover } from '@/shared/ui/patterns/boot/BootCover';
import { RouterLink } from '@/shared/ui/patterns/routing/RouterLink';
import { Outlet, useRouter, useRouterState } from '@tanstack/react-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { docAt, firstOf, groupLabel, searchEntries } from '../../entities/document';
import { RocketMark } from '../../shared/loading/RocketMark';
import styles from '../../shared/styles/prose.module.css';

function Brand({ isFolded, area }: { isFolded: boolean; area: 'blog' | 'webcraft' | 'settings' }) {
  const router = useRouter();
  return <div className={shell.brand}>
    <RouterLink href="/blog/" aria-label="dev-goraebap 처음으로"><span className={shell.logo} dangerouslySetInnerHTML={{ __html: logo }} /></RouterLink>
    {isFolded ? null : <div>{area === 'settings' ? <Text weight="semibold">설정</Text> : <Selector label="사이트 영역" isLabelHidden value={area} width="8rem" options={[{ value: 'blog', label: 'Blog' }, { value: 'webcraft', label: 'Webcraft' }]} onChange={value => void router.navigate({ href: `/${value}/` })} />}</div>}
  </div>;
}

/** 문서 찾기: 문서 제목·묶음·설명으로 고른다. Ctrl+K(맥 ⌘K)로 연다. */
function Search() {
  const router = useRouter();
  const [isOpen, setOpen] = useState(false);
  const source = useMemo(() => createStaticSource(searchEntries.map(entry => ({ id: entry.id, label: entry.label, auxiliaryData: { group: entry.group, description: entry.description } })), {
    keywords: item => [String((item.auxiliaryData as { group?: string })?.group ?? ''), String((item.auxiliaryData as { description?: string })?.description ?? '')],
  }), []);
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setOpen(true); }
    };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, []);
  return <>
    <IconButton label="문서 찾기" tooltip="문서 찾기 (Ctrl K)" variant="ghost" size="sm" icon={icon('search')} onClick={() => setOpen(true)} />
    <CommandPalette isOpen={isOpen} onOpenChange={setOpen} label="문서 찾기" searchSource={source}
      emptySearchText="맞는 문서가 없습니다." onValueChange={path => { if (path) void router.navigate({ href: path }); }} />
  </>;
}

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
 * 화면 이동의 진행 표시(업무 앱의 RouteStage와 같은 규칙). 가리는 덮개를 두지 않는다: 다음 문서를 준비하는 동안 지금
 * 문서를 그대로 두고, 150ms가 지나면 콘텐츠 카드 위쪽 테두리가 테마 강조색으로 흐른다. 띄웠으면 최소 300ms 둔 뒤 내린다.
 * 준비된 문서끼리는 콘텐츠 영역만 View Transition으로 200ms 교차 페이드한다(main.tsx, base.css).
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

/**
 * 사이트의 AppFrame과 Page에 콘텐츠를 넣는다. 사이드바에 전역 검색과 설정을 두고, 페이지 머리에는 해당 목록의 도구만 둔다.
 */
export function GuideShell() {
  const router = useRouter();
  const { mode, layout } = usePreferences();
  const isPhone = useIsPhone();
  const isReady = useFirstResolved();
  const progress = useProgress();
  const pathname = useRouterState({ select: state => state.resolvedLocation?.pathname ?? state.location.pathname });
  const doc = docAt(pathname);
  useEffect(() => { document.title = `${doc?.title ?? (pathname === '/blog/' ? '모든 글' : '설정')} · dev-goraebap`; }, [doc]);
  const area = pathname.startsWith('/settings/') ? 'settings' : pathname.startsWith('/blog/') ? 'blog' : 'webcraft';
  const space = area === 'settings' ? settingsSpace : area === 'blog' ? blogSpace : guideSpace;
  const groups = space.sections.flatMap(section => section.entries);
  // 휴대폰 하단 탭: 자주 여는 네 묶음. 나머지는 더보기에서 고른다. 탭은 좁으므로 괄호 속 한글명을 뗀다.
  const tabs = (area === 'settings' ? ['/settings/appearance/', '/settings/plugins/'] : area === 'blog' ? ['/blog/', '/settings/appearance/'] : ['/webcraft/', '/webcraft/rules/goraebap-mode/', '/webcraft/rules/design-system/', '/webcraft/catalog/playground/'])
    .map(path => groups.find(entry => entry.path === path) ?? (path === '/settings/appearance/' ? { path, label: '설정', icon: 'settings' as const } : undefined)).filter((entry): entry is NonNullable<typeof entry> => !!entry)
    .map(entry => ({ ...entry, label: entry.label.replace(/ \(.*\)$/, '') }));
  // 묶음 › 문서. 지침의 첫 장(묶음 주소와 같은 문서)과 첫 화면은 이름 하나만 둔다.
  const crumbs = doc && doc.path !== '/webcraft/' && doc.path !== doc.group
    ? [{ label: groupLabel(doc.group), href: doc.group }, { label: doc.title }]
    : [{ label: doc ? (doc.path === doc.group && doc.path !== '/webcraft/' ? groupLabel(doc.group) : doc.title) : pathname === '/blog/' ? '모든 글' : area === 'settings' ? (pathname.includes('/plugins') ? '플러그인' : '화면') : '없는 문서' }];
  return <ReferenceTheme mode={mode}>
    <LinkProvider component={RouterLink}>
        <AppFrame space={space} pathname={pathname} tabs={tabs} openGroups="current" layout={layout} brand={isFolded => <Brand isFolded={isFolded} area={area} />}
          headerTools={<Search />}
          sidebarBottom={folded => folded ? <IconButton label="설정" variant="ghost" size="sm" icon={icon('settings')} onClick={() => void router.navigate({ href: '/settings/appearance/' })} /> : <div className={shell.settingsEntry}><Button label="설정" width="100%" variant="ghost" size="sm" icon={icon('settings')} onClick={() => void router.navigate({ href: '/settings/appearance/' })} /></div>}
          footer={folded => folded ? null : <div className={shell.footer}><span className={shell.version}>v{siteVersion}</span></div>}
          pageFooter={!isPhone ? <AgentBar onAgent={() => void router.navigate({ href: '/settings/plugins/' })} /> : undefined}
          phoneAppBar={<div className={shell.phoneBrand}><Brand isFolded={false} area={area} /></div>}
          // 자기 페이지가 없는 묶음 메뉴(UI 키트의 묶음 등)만 묶음의 첫 문서로 간다. 아키텍처 절처럼 개요 페이지가 있으면 그 페이지로.
          onNavigate={path => void router.navigate({ href: docAt(path) ? path : firstOf(path) ?? path })}>
          <Page crumbs={crumbs} views={isPhone && pathname === '/blog/' ? <></> : undefined} tools={pathname === '/blog/' ? <BlogTools /> : undefined} hasHeading={pathname === '/blog/'} hasPattern={false} stableGutter>
            <div className={styles.stage} aria-busy={progress.moving || undefined}>
              {/* 늘 그려 두고 보이기만 바꾼다. 화면 읽기 프로그램에는 상태 문구로 알린다. */}
              <div className={styles.glow} data-visible={progress.shown || undefined} data-route-progress={progress.shown ? '' : undefined} aria-hidden="true" />
              <span className={styles.spoken} role="status" aria-live="polite">{progress.shown ? '다음 문서를 불러오는 중' : ''}</span>
              <div className={styles.content}><Outlet /></div>
            </div>
          </Page>
        </AppFrame>
        <BootCover isReady={isReady} mark={<RocketMark />} />
    </LinkProvider>
  </ReferenceTheme>;
}
