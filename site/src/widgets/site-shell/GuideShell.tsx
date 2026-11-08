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
import { useEffect, useMemo, useState } from 'react';
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

/**
 * 데이터 상태 규칙의 전환: 다음 문서가 준비될 때까지 지금 문서를 보이고, 180ms가 넘을 때만 본문 자리에 덮개를 씌운다.
 * 새 문서는 160ms에 걸쳐 나타난다(DocPage).
 */
function useCover() {
  const isPending = useRouterState({ select: state => state.status === 'pending' && !!state.resolvedLocation && state.location.pathname !== state.resolvedLocation.pathname });
  const [isCovered, setCovered] = useState(false);
  useEffect(() => {
    if (!isPending) { setCovered(false); return undefined; }
    const timer = window.setTimeout(() => setCovered(true), 180);
    return () => window.clearTimeout(timer);
  }, [isPending]);
  return isCovered;
}

/**
 * 사이트의 AppFrame과 Page에 콘텐츠를 넣는다. 사이드바에 전역 검색과 설정을 두고, 페이지 머리에는 해당 목록의 도구만 둔다.
 */
export function GuideShell() {
  const router = useRouter();
  const { mode, layout } = usePreferences();
  const isPhone = useIsPhone();
  const isReady = useFirstResolved();
  const isCovered = useCover();
  const pathname = useRouterState({ select: state => state.resolvedLocation?.pathname ?? state.location.pathname });
  const doc = docAt(pathname);
  useEffect(() => { document.title = `${doc?.title ?? (pathname === '/blog/' ? '모든 글' : '설정')} · dev-goraebap`; }, [doc]);
  const area = pathname.startsWith('/settings/') ? 'settings' : pathname.startsWith('/blog/') ? 'blog' : 'webcraft';
  const space = area === 'settings' ? settingsSpace : area === 'blog' ? blogSpace : guideSpace;
  const groups = space.sections.flatMap(section => section.entries);
  // 휴대폰 하단 탭: 자주 여는 네 묶음. 나머지는 더보기에서 고른다. 탭은 좁으므로 괄호 속 한글명을 뗀다.
  const tabs = (area === 'settings' ? ['/settings/appearance/', '/settings/plugins/'] : area === 'blog' ? ['/blog/', '/settings/appearance/'] : ['/webcraft/', '/webcraft/rules/webcraft-mode/', '/webcraft/rules/design-system/', '/webcraft/catalog/playground/'])
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
          // 묶음 메뉴는 묶음의 첫 문서로 바로 간다.
          onNavigate={path => void router.navigate({ href: firstOf(path) ?? path })}>
          <Page crumbs={crumbs} views={isPhone && pathname === '/blog/' ? <></> : undefined} tools={pathname === '/blog/' ? <BlogTools /> : undefined} hasHeading={pathname === '/blog/'} hasPattern={false} stableGutter>
            <div className={styles.stage} aria-busy={isCovered || undefined}>
              <div inert={isCovered || undefined}><Outlet /></div>
              {isCovered ? <div className={styles.cover} role="status" aria-label="문서를 불러오는 중">
                <span className={styles.coverMark} aria-hidden="true"><RocketMark /></span>
                <Text type="supporting" color="secondary">불러오는 중입니다</Text>
              </div> : null}
            </div>
          </Page>
        </AppFrame>
        <BootCover isReady={isReady} mark={<RocketMark />} />
    </LinkProvider>
  </ReferenceTheme>;
}
