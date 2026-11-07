import '@kit/foundations/base.css';
import { CommandPalette } from '@astryxdesign/core/CommandPalette';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Outline } from '@astryxdesign/core/Outline';
import { Text } from '@astryxdesign/core/Text';
import { createStaticSource } from '@astryxdesign/core/Typeahead';
import { icon } from '@kit/foundations/icons/solar-icon';
import { useIsPhone } from '@kit/foundations/media';
import { ReferenceTheme } from '@kit/foundations/ReferenceTheme';
import { AppFrame } from '@kit/layouts/app/AppFrame';
import type { NavSpace } from '@kit/layouts/app/nav';
import { Page } from '@kit/layouts/page/Page';
import { navigate } from 'astro:transitions/client';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import styles from './guide.module.css';

type Mode = 'light' | 'dark';
export type SearchEntry = { id: string; label: string; group: string; description?: string };
export type Heading = { id: string; label: string; level: number };
/** 문서마다 페이지에 실리는 정보(#guide-page). 셸은 이동할 때마다 이것과 본문(#guide-article)을 받아 끼운다. */
export type GuidePageData = { path: string; title: string; crumbs: { label: string; href?: string }[]; headings: Heading[] };

const KEY = 'guide-theme';
function initialMode(): Mode {
  if (typeof window === 'undefined') return 'light';
  try { const saved = localStorage.getItem(KEY); if (saved === 'dark' || saved === 'light') return saved; } catch { /* 저장소를 못 쓰면 시스템 설정 */ }
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * 테마 선택을 문서에 남긴다. 견본 iframe은 이 문서의 data-theme을 따른다.
 * 서버는 모드를 모르므로 처음에는 서버와 같은 라이트로 넘겨받고, 바로 저장한 모드로 바꾼다. 처음부터 저장한 모드로 넘겨받으면
 * React가 서버가 그린 테마 표시를 고치지 않아 본문·토글·견본의 모드가 어긋난다. 문서를 옮기면 html 속성이 새 문서 것으로
 * 바뀌므로 그때마다 다시 적는다.
 */
function useMode(): [Mode, (mode: Mode) => void] {
  const [chosen, setMode] = useState<Mode | null>(null);
  const mode = chosen ?? 'light';
  useLayoutEffect(() => { setMode(initialMode()); }, []);
  useLayoutEffect(() => {
    if (!chosen) return undefined;
    const apply = () => {
      const root = document.documentElement;
      root.dataset.theme = mode;
      root.style.colorScheme = mode;
    };
    apply();
    try { localStorage.setItem(KEY, mode); } catch { /* 저장하지 못해도 이번 화면에는 적용된다. */ }
    document.addEventListener('astro:after-swap', apply);
    return () => document.removeEventListener('astro:after-swap', apply);
  }, [chosen, mode]);
  return [mode, setMode];
}

/**
 * 문서를 옮기면 Astro가 head를 새 문서 것으로 맞추며 새 문서에 없는 요소를 지운다. 키트 테마(Astryx)는 실행 중에 head에
 * 스타일을 넣으므로 그대로 두면 지워지고, 글자 크기 같은 테마 값이 Astryx 기본값으로 돌아간다. 셸은 유지되어 다시 넣지
 * 않으므로, 옮기기 직전에 그 스타일에 유지 표시를 달고 새 문서에도 같은 표시의 자리를 둬서 지워지지 않게 한다.
 */
function useKeepRuntimeStyles() {
  useEffect(() => {
    const keep = (event: Event) => {
      const next = (event as Event & { newDocument: Document }).newDocument;
      document.head.querySelectorAll<HTMLStyleElement>('style[data-astryx-theme], style[data-astryx-theme-base], style[data-astryx-theme-prose]').forEach((style, index) => {
        const id = style.getAttribute('data-astro-transition-persist') ?? `astryx-runtime-${index}`;
        style.setAttribute('data-astro-transition-persist', id);
        const holder = next.createElement('style');
        holder.setAttribute('data-astro-transition-persist', id);
        next.head.append(holder);
      });
    };
    document.addEventListener('astro:before-swap', keep);
    return () => document.removeEventListener('astro:before-swap', keep);
  }, []);
}

function readPage(): GuidePageData | null {
  const data = document.getElementById('guide-page')?.textContent;
  return data ? JSON.parse(data) as GuidePageData : null;
}

/** 스크롤하는 가장 가까운 조상(페이지 본문 영역). */
function scrollerOf(node: HTMLElement | null) {
  for (let current = node?.parentElement; current; current = current.parentElement) {
    if (/(auto|scroll)/.test(getComputedStyle(current).overflowY)) return current;
  }
  return null;
}

/** 데이터 상태 규칙: 180ms 안에 준비되면 덮지 않고, 준비를 기다리는 것은 길어도 0.8초, 전환은 160ms 교차 페이드. */
const COVER_DELAY_MS = 180;
const READY_LIMIT_MS = 800;
const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

/** 내용에 맞춰 높이를 정하는 부품 견본이 실제 크기를 알려 올 때까지. */
function sized(stage: HTMLElement) {
  if (stage.dataset.content) return Promise.resolve();
  return new Promise<void>(resolve => {
    const observer = new MutationObserver(() => { if (stage.dataset.content) { observer.disconnect(); resolve(); } });
    observer.observe(stage, { attributes: true, attributeFilter: ['data-content'] });
  });
}

/**
 * 셸은 문서를 옮겨도 유지되고(transition:persist) 본문만 바꿔 끼운다. 다음 문서가 준비될 때까지 지금 문서를 그대로
 * 보인다(데이터 상태 규칙). 새 본문은 보이지 않게 겹쳐 두고 글꼴 조각과 부품 견본의 높이가 정해지면 160ms 교차
 * 페이드로 바꾼다. 그래서 바꾼 뒤에 글자가 바뀌거나 견본 높이 때문에 글이 밀리지 않는다. 180ms가 넘으면 덮개를
 * 씌운다. 휴대폰↔데스크톱 전환으로 자리가 새로 그려져도 같은 본문을 다시 붙인다.
 */
function useArticle() {
  const [page, setPage] = useState<GuidePageData | null>(null);
  const [isCovered, setCovered] = useState(false);
  const article = useRef<HTMLElement | null>(null);
  const slot = useRef<HTMLDivElement | null>(null);
  const setSlot = useCallback((node: HTMLDivElement | null) => {
    slot.current = node;
    if (node && article.current && article.current.parentElement !== node) node.replaceChildren(article.current);
  }, []);
  useEffect(() => {
    let version = 0;
    let coverTimer = 0;
    const startCover = () => { window.clearTimeout(coverTimer); coverTimer = window.setTimeout(() => setCovered(true), COVER_DELAY_MS); };
    const sync = async () => {
      const mine = ++version;
      const data = readPage();
      const next = document.getElementById('guide-article');
      if (!next) { setPage(data); return; }
      // 셸 안에 남은 이전 본문과 이름이 겹치지 않게 표시를 떼고, 보이지 않게 겹쳐 둔 채 준비한다.
      next.removeAttribute('id');
      next.hidden = false;
      next.classList.add(styles.staged);
      slot.current?.append(next);
      const autos = [...next.querySelectorAll<HTMLElement & { load?: () => void }>('guide-sample[data-auto]')];
      autos.forEach(stage => stage.load?.());
      if (!coverTimer) startCover();
      await Promise.race([Promise.all([document.fonts.ready, ...autos.map(sized)]), wait(READY_LIMIT_MS)]);
      if (mine !== version) { next.remove(); return; }
      window.clearTimeout(coverTimer);
      coverTimer = 0;
      const hadArticle = !!article.current;
      const swap = () => {
        next.classList.remove(styles.staged);
        article.current = next;
        slot.current?.replaceChildren(next);
        flushSync(() => { setPage(data); setCovered(false); });
        const target = location.hash ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
        if (target) target.scrollIntoView();
        else { const scroller = scrollerOf(slot.current); if (scroller) scroller.scrollTop = 0; }
      };
      const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
      const body = slot.current?.parentElement;
      if (hadArticle && !reduce && body && document.startViewTransition && document.visibilityState === 'visible') {
        body.classList.add(styles.fading);
        const transition = document.startViewTransition(swap);
        transition.finished.finally(() => body.classList.remove(styles.fading)).catch(() => {});
        transition.ready.catch(() => {});
      } else swap();
    };
    void sync();
    const onLoad = () => void sync();
    document.addEventListener('astro:before-preparation', startCover);
    document.addEventListener('astro:page-load', onLoad);
    return () => {
      window.clearTimeout(coverTimer);
      document.removeEventListener('astro:before-preparation', startCover);
      document.removeEventListener('astro:page-load', onLoad);
    };
  }, []);
  return { page, isCovered, setSlot };
}

function Brand({ isFolded }: { isFolded: boolean }) {
  return <a href="/" className={styles.brand} aria-label="고래밥 화면 규칙 처음으로">
    <span className={styles.mark}>{icon('library')}</span>
    {isFolded ? null : <Text weight="semibold" maxLines={1}>고래밥 화면 규칙</Text>}
  </a>;
}

/** 문서 찾기: 문서 제목·묶음·설명으로 고른다. Ctrl+K(맥 ⌘K)로 연다. */
function Search({ entries }: { entries: SearchEntry[] }) {
  const [isOpen, setOpen] = useState(false);
  const source = useMemo(() => createStaticSource(entries.map(entry => ({ id: entry.id, label: entry.label, auxiliaryData: { group: entry.group, description: entry.description } })), {
    keywords: item => [String((item.auxiliaryData as { group?: string })?.group ?? ''), String((item.auxiliaryData as { description?: string })?.description ?? '')],
  }), [entries]);
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
      emptySearchText="맞는 문서가 없습니다." onValueChange={path => { if (path) void navigate(path); }} />
  </>;
}

/**
 * 가이드의 틀: 키트의 AppFrame(사이드바·휴대폰 하단 탭)과 Page(머리 줄)에 문서를 넣는다. 본문은 읽는 화면이라 약 720px 열로
 * 제한하고(콘텐츠 폭 규칙), 넓은 화면에서만 오른쪽에 문서 안 목차를 둔다.
 */
export function GuideShell({ space, search }: { space: NavSpace; search: SearchEntry[] }) {
  const [mode, setMode] = useMode();
  useKeepRuntimeStyles();
  const { page, isCovered, setSlot } = useArticle();
  const isPhone = useIsPhone();
  const themeLabel = mode === 'dark' ? '밝은 화면으로' : '어두운 화면으로';
  const themeButton = <IconButton label={themeLabel} tooltip={themeLabel} variant="ghost" size="sm" icon={icon(mode === 'dark' ? 'sun' : 'moon')}
    onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')} />;
  const outline = (page?.headings ?? []).filter(heading => heading.level <= 3);
  // 휴대폰 하단 탭: 자주 여는 네 묶음. 나머지는 더보기에서 고른다.
  const groups = space.sections.flatMap(section => section.entries);
  const tabs = ['/start/', '/common/', '/app-shell/', '/catalog/playground/'].map(path => groups.find(entry => entry.path === path)).filter((entry): entry is NonNullable<typeof entry> => !!entry)
    // 탭은 좁으므로 괄호 속 한글명을 뗀 짧은 이름을 쓴다.
    .map(entry => ({ ...entry, label: entry.label.replace(/ \(.*\)$/, '') }));
  return <ReferenceTheme mode={mode}>
    <AppFrame space={space} pathname={page?.path ?? '/'} tabs={tabs} brand={isFolded => <Brand isFolded={isFolded} />}
      headerTools={<Search entries={search} />} phoneAppBar={<Search entries={search} />}
      // 묶음 메뉴는 넘김 페이지를 거치지 않고 묶음의 첫 문서로 바로 간다.
      onNavigate={path => void navigate(groups.find(entry => entry.path === path)?.children?.[0]?.path ?? path)}>
      {/* 가이드 페이지에는 만들기 같은 페이지 동작이 없으므로 머리 줄 오른쪽 자리에 화면 모드 전환을 둔다. */}
      <Page crumbs={[...(page?.crumbs ?? []), { label: page?.title ?? '' }]} pageActions={themeButton} hasHeading={false} hasPattern={false}>
        <div className={styles.body} aria-busy={isCovered || undefined}>
          {isCovered ? <div className={styles.cover} role="status" aria-label="문서를 불러오는 중">
            <Text type="supporting" color="secondary">불러오는 중입니다</Text>
          </div> : null}
          <div ref={setSlot} className={styles.prose} inert={isCovered || undefined} />
          {!isPhone && outline.length > 1 ? <aside key={page?.path} className={styles.outline}>
            <Text type="supporting" color="secondary" weight="semibold">이 문서</Text>
            <Outline items={outline} label="이 문서의 목차" density="compact" />
          </aside> : null}
        </div>
      </Page>
    </AppFrame>
  </ReferenceTheme>;
}
