import { CommandPalette } from '@astryxdesign/core/CommandPalette';
import { LinkProvider } from '@astryxdesign/core/Link';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Text } from '@astryxdesign/core/Text';
import { createStaticSource } from '@astryxdesign/core/Typeahead';
import { icon } from '@kit/foundations/icons/solar-icon';
import { ReferenceTheme } from '@kit/foundations/ReferenceTheme';
import { AppFrame } from '@kit/layouts/app/AppFrame';
import { Page } from '@kit/layouts/page/Page';
import { BootCover } from '@kit/patterns/boot/BootCover';
import { RouterLink } from '@kit/patterns/routing/RouterLink';
import { MDXProvider } from '@mdx-js/react';
import { Outlet, useRouter, useRouterState } from '@tanstack/react-router';
import { useEffect, useLayoutEffect, useMemo, useState, type ComponentPropsWithRef } from 'react';
import { docAt, firstOf, groupLabel, guideSpace, searchEntries } from '../docs';
import { Sample } from '../samples/Sample';
import { SampleGroup } from '../samples/SampleGroup';
import { Source } from '../samples/Source';
import styles from './guide.module.css';

type Mode = 'light' | 'dark';
const KEY = 'guide-theme';

function initialMode(): Mode {
  try { const saved = localStorage.getItem(KEY); if (saved === 'dark' || saved === 'light') return saved; } catch { /* 저장소를 못 쓰면 시스템 설정 */ }
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** 테마 선택을 문서에 남긴다. 견본 iframe과 첫 방문 덮개(bootCover 플러그인)가 같은 값을 읽는다. */
function useMode(): [Mode, (mode: Mode) => void] {
  const [mode, setMode] = useState<Mode>(initialMode);
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = mode;
    root.style.colorScheme = mode;
    try { localStorage.setItem(KEY, mode); } catch { /* 저장하지 못해도 이번 화면에는 적용된다. */ }
  }, [mode]);
  return [mode, setMode];
}

/** 문서 안의 링크: 가이드 주소는 라우터로 옮기고, 다른 사이트는 새 창으로 연다. */
function DocLink({ href = '', ...props }: ComponentPropsWithRef<'a'>) {
  const isExternal = /^https?:/.test(href);
  return <RouterLink href={href} {...(isExternal ? { target: '_blank', rel: 'noopener' } : {})} {...props} />;
}
const mdxComponents = { a: DocLink, Sample, SampleGroup, Source };

function Brand({ isFolded }: { isFolded: boolean }) {
  return <RouterLink href="/" className={styles.brand} aria-label="고래밥 지침 처음으로">
    <span className={styles.mark}>{icon('library')}</span>
    {isFolded ? null : <Text weight="semibold" maxLines={1}>고래밥 지침</Text>}
  </RouterLink>;
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
 * 가이드의 틀: 키트의 AppFrame(사이드바·휴대폰 하단 탭)과 Page(머리 줄)에 문서를 넣는다. 머리 줄 오른쪽 끝에는 화면 모드
 * 전환을 둔다(가이드에는 만들기 같은 페이지 동작이 없다).
 */
export function GuideShell() {
  const router = useRouter();
  const [mode, setMode] = useMode();
  const isReady = useFirstResolved();
  const isCovered = useCover();
  const pathname = useRouterState({ select: state => state.resolvedLocation?.pathname ?? state.location.pathname });
  const doc = docAt(pathname);
  const themeLabel = mode === 'dark' ? '밝은 화면으로' : '어두운 화면으로';
  const themeButton = <IconButton label={themeLabel} tooltip={themeLabel} variant="ghost" size="sm" icon={icon(mode === 'dark' ? 'sun' : 'moon')}
    onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')} />;
  const groups = guideSpace.sections.flatMap(section => section.entries);
  // 휴대폰 하단 탭: 자주 여는 네 묶음. 나머지는 더보기에서 고른다. 탭은 좁으므로 괄호 속 한글명을 뗀다.
  const tabs = ['/start/', '/rules/goraebap-mode/', '/rules/design-system/', '/catalog/playground/']
    .map(path => groups.find(entry => entry.path === path)).filter((entry): entry is NonNullable<typeof entry> => !!entry)
    .map(entry => ({ ...entry, label: entry.label.replace(/ \(.*\)$/, '') }));
  // 묶음 › 문서. 지침의 첫 장(묶음 주소와 같은 문서)과 첫 화면은 이름 하나만 둔다.
  const crumbs = doc && doc.path !== '/' && doc.path !== doc.group
    ? [{ label: groupLabel(doc.group), href: doc.group }, { label: doc.title }]
    : [{ label: doc ? (doc.path === doc.group && doc.path !== '/' ? groupLabel(doc.group) : doc.title) : '없는 문서' }];
  return <ReferenceTheme mode={mode}>
    <LinkProvider component={RouterLink}>
      <MDXProvider components={mdxComponents}>
        <AppFrame space={guideSpace} pathname={pathname} tabs={tabs} brand={isFolded => <Brand isFolded={isFolded} />}
          headerTools={<Search />} phoneAppBar={<Search />}
          // 묶음 메뉴는 묶음의 첫 문서로 바로 간다.
          onNavigate={path => void router.navigate({ href: firstOf(path) ?? path })}>
          <Page crumbs={crumbs} pageActions={themeButton} hasHeading={false} hasPattern={false}>
            <div className={styles.stage} aria-busy={isCovered || undefined}>
              <div inert={isCovered || undefined}><Outlet /></div>
              {isCovered ? <div className={styles.cover} role="status" aria-label="문서를 불러오는 중">
                <Text type="supporting" color="secondary">불러오는 중입니다</Text>
              </div> : null}
            </div>
          </Page>
        </AppFrame>
        <BootCover isReady={isReady} />
      </MDXProvider>
    </LinkProvider>
  </ReferenceTheme>;
}
