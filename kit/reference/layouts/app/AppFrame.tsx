import { AppShell } from '@astryxdesign/core/AppShell';
import { Card } from '@astryxdesign/core/Card';
import { HStack } from '@astryxdesign/core/HStack';
import { IconButton } from '@astryxdesign/core/IconButton';
import { SideNav, SideNavItem, SideNavSection } from '@astryxdesign/core/SideNav';
import { Text } from '@astryxdesign/core/Text';
import { Token } from '@astryxdesign/core/Token';
import { VStack } from '@astryxdesign/core/VStack';
import { Fragment, useEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { icon, solarIcon } from '../../foundations/icons/solar-icon';
import { useIsPhone } from '../../foundations/media';
import { PageAppBarContext, PageChromeContext } from '../page/page-context';
import { PAGE_HEADER_HEIGHT } from '../page/PageHeader';
import { MobileMenuSheet, MobileTabBar } from './MobileNav';
import type { NavEntry, NavSpace } from './nav';
import styles from './app-frame.module.css';

export type ShellLayout = 'inset' | 'split';

/** 큰 화면의 루트 배율(base.css와 같은 식). 사이드바 px 범위를 같은 비율로 키운다. */
const rootScale = () => typeof window === 'undefined' || window.innerWidth < 1920 ? 1
  : Math.min(19, Math.max(16, 7 + window.innerWidth * 0.0046875)) / 16;

/**
 * Astryx AppShell 위의 앱 틀. 데스크톱은 SideNav(340px로 열리고 220~380px로 끌어 조절, 접으면 아이콘만), inset은 바탕
 * 위에 떨어진 페이지 카드, split은 가는 선으로 나눈 면이다. 휴대폰은 사이드바 대신 하단 탭(현재 메뉴의 앞 네 곳 + 더보기)과
 * 나머지 목적지를 담은 더보기 시트를 쓰고, 상세·양식이 열리면 하단 탭을 치운다. 두 배치에서 페이지의 슬롯은 같다.
 * 본문의 부모 요소 종류는 분기점·배치를 바꿔도 같게 유지해 작성 중인 초안이 다시 마운트되지 않게 한다.
 */
export function AppFrame({ space, pathname, isSelected, brand, headerTools, profile, footer, phoneAppBar, layout = 'inset',
  tabs, onNavigate, openGroups = 'all', children }: {
  space: NavSpace;
  pathname: string;
  /** 메뉴 항목이 현재인지. 기본은 주소의 가장 긴 접두사. 검색 조건으로 나뉜 메뉴는 직접 판단한다. */
  isSelected?: (path: string) => boolean;
  /** 사이드바 머리의 로고·이름(홈 링크). 접힌 사이드바에서는 표시만 남긴다. */
  brand: (isFolded: boolean) => ReactNode;
  /** 머리 줄 오른쪽 상자 버튼(전역 검색 등). */
  headerTools?: ReactNode;
  /** 머리 아래 내 정보. */
  profile?: ReactNode;
  /** 사이드바 바닥(버전·환경 설정). */
  footer?: ReactNode;
  /** 휴대폰 일반 페이지 머리 줄 끝의 앱 도구. */
  phoneAppBar?: ReactNode;
  layout?: ShellLayout;
  /** 휴대폰 하단 탭. 없으면 현재 메뉴의 앞 네 곳. */
  tabs?: NavEntry[];
  /** 메뉴 선택을 라우터로 넘긴다. 없으면 링크를 따른다. */
  onNavigate?: (path: string) => void;
  /**
   * 하위 메뉴 묶음을 처음에 어떻게 펼칠지. 'all'은 모두 펼침(메뉴가 짧은 업무 앱), 'current'는 현재 위치의 묶음만 펼침
   * (문서 사이트처럼 묶음이 많을 때). 'current'에서는 다른 묶음으로 옮겨 가면 그 묶음도 펼치고, 사용자가 연 묶음은 둔다.
   */
  openGroups?: 'all' | 'current';
  children: ReactNode;
}) {
  const isPhone = useIsPhone();
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isCollapsed, setCollapsed] = useState(false);
  const [isFull, setFull] = useState(false);
  const chrome = useMemo(() => ({ setFull }), []);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const entries = space.sections.flatMap(section => section.entries);
  const current = [...entries, ...entries.flatMap(entry => entry.children ?? [])]
    .filter(entry => pathname === entry.path.split('?')[0] || pathname.startsWith(`${entry.path.split('?')[0]}/`))
    .sort((a, b) => b.path.length - a.path.length)[0]?.path;
  const selected = isSelected ?? ((path: string) => path === current);
  const currentGroup = entries.find(entry => entry.children?.length && (selected(entry.path) || entry.children.some(child => selected(child.path))))?.path;
  const [openPaths, setOpenPaths] = useState(() => new Set(currentGroup ? [currentGroup] : []));
  useEffect(() => {
    if (currentGroup) setOpenPaths(paths => (paths.has(currentGroup) ? paths : new Set(paths).add(currentGroup)));
  }, [currentGroup]);
  const groupCollapse = (path: string) => (openGroups === 'all' ? { defaultIsCollapsed: false } : {
    isCollapsed: !openPaths.has(path),
    onCollapsedChange: (isClosed: boolean) => setOpenPaths(paths => {
      const next = new Set(paths);
      if (isClosed) next.delete(path); else next.add(path);
      return next;
    }),
  });
  const navigate = (path: string) => { onNavigate?.(path); setMenuOpen(false); };
  const go = (path: string) => onNavigate && ((event: MouseEvent) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey) return;
    event.preventDefault();
    navigate(path);
  });
  const isFolded = isCollapsed && !isPhone;
  const item = (entry: NavEntry): ReactNode => <SideNavItem key={entry.path} label={entry.label} href={entry.path} isSelected={selected(entry.path)}
    onClick={go(entry.path)} icon={entry.icon && solarIcon(entry.icon)} selectedIcon={entry.icon && solarIcon(entry.icon, true)}
    collapsible={entry.children?.length ? groupCollapse(entry.path) : undefined}
    endContent={entry.badge ? <Token label={entry.badge > 99 ? '99+' : String(entry.badge)} size="sm" /> : undefined}>
    {entry.children?.length ? entry.children.map(item) : undefined}
  </SideNavItem>;
  const toggleLabel = isFolded ? '메뉴 펼치기' : '메뉴 접기';
  const toggle = <IconButton ref={toggleRef} label={toggleLabel} tooltip={toggleLabel} variant="ghost" size="sm" icon={icon('sidebar', !isFolded)}
    onClick={() => {
      setCollapsed(!isFolded);
      requestAnimationFrame(() => toggleRef.current?.focus({ preventScroll: true }));
    }} />;
  const back = space.back;
  const backRow = back ? <HStack paddingInline={isFolded ? 0 : 1} hAlign={isFolded ? 'center' : 'start'}>
    {isFolded
      ? <IconButton label={back.label} tooltip={back.label} variant="ghost" size="sm" icon={icon('back')} onClick={() => navigate(back.path)} />
      : <button type="button" className={styles.back} aria-label={`${back.label}: ${space.title}`} onClick={() => navigate(back.path)}>
        {icon('back')}<Text weight="semibold" maxLines={1}>{space.title}</Text>
      </button>}
  </HStack> : undefined;
  const scale = rootScale();
  const sideNav = <SideNav key={isFolded ? 'folded' : 'open'} aria-label="주 메뉴" collapsible={{ hasButton: false }}
    resizable={{ defaultWidth: Math.round(340 * scale), minWidth: Math.round(220 * scale), maxWidth: Math.round(380 * scale), isCollapsed, onCollapseChange: setCollapsed }}
    header={isFolded
      ? <VStack width="100%" gap={2} hAlign="center" paddingBlock={2}>{brand(true)}{headerTools}</VStack>
      : <VStack width="100%" gap={2} paddingInline={2}>
        <HStack className={layout === 'split' ? styles.splitBrandRow : undefined} height={PAGE_HEADER_HEIGHT} hAlign="between" vAlign="center" gap={1} paddingInlineStart={2}>
          {brand(false)}
          <HStack className={styles.brandTools} gap={1} vAlign="center">{headerTools}{toggle}</HStack>
        </HStack>
        {profile}
      </VStack>}
    topContent={backRow}
    footerIcons={isFolded ? toggle : footer}>
    {space.sections.map((section, index) => <Fragment key={section.title}>
      {/* 접힌 메뉴는 묶음 이름이 사라지므로 선으로 묶음을 나눈다. */}
      {isFolded && index > 0 ? <hr className={styles.navRule} /> : null}
      <SideNavSection title={section.title} isHeaderHidden={section.isHeaderHidden}>{section.entries.map(item)}</SideNavSection>
    </Fragment>)}
  </SideNav>;
  const page = <PageChromeContext value={chrome}><PageAppBarContext value={isPhone ? phoneAppBar : null}>{children}</PageAppBarContext></PageChromeContext>;
  if (isPhone) {
    const shownTabs = tabs ?? entries.slice(0, 4);
    const tabPaths = new Set(shownTabs.map(tab => tab.path));
    // 하위 목적지는 상위 항목 아래 묶음으로 남긴다. 상위가 탭에 있어도 남은 하위가 있으면 묶음 머리로 다시 보인다.
    const more = entries.flatMap(entry => {
      const children = (entry.children ?? []).filter(child => !tabPaths.has(child.path));
      return tabPaths.has(entry.path) && !children.length ? [] : [{ ...entry, children }];
    });
    return <AppShell variant="surface">
      <VStack height="100%">
        <VStack className={styles.page}>{page}</VStack>
        {isFull ? null : <MobileTabBar tabs={shownTabs} isSelected={selected} isMoreOpen={isMenuOpen} hasMore={more.length > 0 || !!back}
          onNavigate={onNavigate} onMore={() => setMenuOpen(true)} />}
        <MobileMenuSheet isOpen={isMenuOpen && !isFull} onOpenChange={setMenuOpen} entries={more} isSelected={selected} onSelect={go}
          back={back ? { ...back, title: space.title } : undefined} />
      </VStack>
    </AppShell>;
  }
  if (layout === 'split') return <AppShell variant="section" sideNav={sideNav}>
    <VStack height="100%"><VStack className={styles.page}>{page}</VStack></VStack>
  </AppShell>;
  // inset의 페이지 면은 페이지 바탕색이라 그 위의 카드가 한 단계 밝게 선다. AppShell의 elevated는 상단 막대가 있을 때만 둥글어 Card로 둔다.
  return <AppShell variant="wash" sideNav={sideNav}>
    <VStack height="100%" paddingBlock={2} paddingInlineEnd={2}>
      <Card className={styles.page} variant="page" padding={0} elevation="low">{page}</Card>
    </VStack>
  </AppShell>;
}
