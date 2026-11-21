import { documentBodyStore, documentOptions, libraryOptions, type DocumentRow } from '@/entities/document';
import { sessionOptions } from '@/shared/auth';
import type { JSONNode } from '@/shared/lib/rich-document';
import {
  DEFAULT_PAGE_SETUP, DocumentSettings, formatOf, PageCanvas, pageSetupOf, printPageRule, type PageLayout, type PageSetup, type SettingsTab,
} from '@/shared/ui/paged-document';
import { RichBody, type RichBodySnapshot, type RichBodyStore } from '@/shared/ui/rich-body';
import { Button } from '@/shared/ui/kit/button';
import { Spinner } from '@/shared/ui/kit/spinner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui/kit/tooltip';
import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { fitTables, printBody } from '../model/print-body';
import { printBodyKey, useAdjustments } from '../model/use-adjustments';
import { SettingsDock } from './SettingsDock';

/** 문서 · 표지 · 목차 쪽 하나의 틀. 미리보기의 종이는 바탕과 옅은 그림자, 인쇄에서는 칠하지 않는다. */
const SHEET = 'flex flex-col [&_[data-page-count][data-look]_[data-sheet]]:bg-background [&_[data-page-count][data-look]_[data-sheet]]:shadow-md '
  + 'print:[&_[data-page-count][data-look]_[data-sheet]]:bg-transparent print:[&_[data-page-count][data-look]_[data-sheet]]:shadow-none';
/** 목차 한 줄: 왼쪽 제목, 점선 채움, 오른쪽 쪽 번호. 긴 제목은 줄을 바꾸고 점선과 번호는 마지막 줄에 맞춘다. */
const TOC_ROW = 'flex items-baseline gap-1.5 leading-[1.6] font-semibold text-inherit no-underline data-heading:font-normal data-heading:text-muted-foreground '
  + 'data-[depth="1"]:pl-5 data-[depth="2"]:pl-10 data-[depth="3"]:pl-15 data-[depth="4"]:pl-20 data-[depth="5"]:pl-20';
const TOC_TITLE = 'mb-3 text-2xl font-bold';

type Entry = { page: DocumentRow; depth: number };
/** 목차 한 줄: 문서 제목이나 본문 제목. target은 그 자리의 id다(PDF 안에서 누르면 그 쪽으로 간다). */
type TocRow = { target: string; text: string; depth: number; isHeading: boolean; page?: number };
const sectionTarget = (id: string) => `toc-d-${id}`;
const headingTarget = (blockId: string) => `toc-h-${blockId}`;
const titleBlock = (id: string) => `print-title-${id}`;
/** 내보내기 대화상자에서 고른 값(1·0). 없으면 undefined로 두어 기본값을 쓴다. */
const flag = (params: URLSearchParams, key: string) => params.get(key) === '1' ? true : params.get(key) === '0' ? false : undefined;
const countNodes = (body: JSONNode | null | undefined, kinds: string[]): number => body
  ? Number(kinds.includes(body.type)) + (body.content ?? []).reduce((sum, child) => sum + countNodes(child, kinds), 0) : 0;
/** 표지에는 머리말·바닥글을 두지 않는다. */
const bare = (setup: PageSetup): PageSetup => ({ ...setup, header: { left: '', right: '' }, footer: { left: '', center: '', right: '' } });
/** 휴대폰 폭에서 바뀌는 글자 토큰(app/theme/tailwind.css의 @media). 인쇄 화면은 화면에서 쓰던 값으로 고정한다. */
const PINNED_TOKENS = ['--text-xs', '--text-sm', '--text-base'];
/** 쪽 끝에 남기는 여유(8mm, px): 인쇄의 글자 폭이 화면과 조금 달라도 그 쪽에 들어가게 한다(본문 나눔과 같은 값). */
const PRINT_SLACK = 12 * 96 / 25.4;
/** How long the page waits for every body, diagram and picture to draw before it says it could not. */
const DRAW_LIMIT = 30_000;
const singlePage: PageLayout = { count: 1, pages: [{ number: 1, continues: false, headings: [] }], oversized: [] };

/** 맨 위 문서와 그 아래 페이지들을 문서 트리의 순서(페이지 관리의 순서)대로 깊이와 함께 펼친다. */
function flatten(rootId: string, pages: DocumentRow[], order: string[]): Entry[] {
  const rank = (id: string) => { const at = order.indexOf(id); return at < 0 ? Number.MAX_SAFE_INTEGER : at; };
  // 순서 목록에 없는 페이지(아직 순서를 바꾼 적 없는 새 페이지)는 만든 순서로 놓는다.
  const childrenOf = (id: string) => pages.filter(page => page.parentId === id)
    .sort((a, b) => rank(a.id) - rank(b.id) || a.createdAt.localeCompare(b.createdAt));
  const out: Entry[] = [];
  const walk = (page: DocumentRow, depth: number) => { out.push({ page, depth }); childrenOf(page.id).forEach(child => walk(child, depth + 1)); };
  const root = pages.find(page => page.id === rootId);
  if (root) walk(root, 0);
  return out;
}

/** 종이에서 누를 수 있는 링크만 남긴다: 다른 사이트로 가는 http(s)·mailto. 문서 사이 링크와 이 서비스 주소는 PDF를 받는 사람에게 쓸모가 없다. */
function isOutside(href: unknown): boolean {
  if (typeof href !== 'string') return false;
  try {
    const url = new URL(href, window.location.origin);
    return url.protocol === 'mailto:' || (/^https?:$/.test(url.protocol) && /^(https?:|mailto:)/i.test(href) && url.origin !== window.location.origin);
  } catch { return false; }
}
function unlink(node: JSONNode): JSONNode {
  const marks = node.marks?.filter(mark => mark.type !== 'link' || isOutside(mark.attrs?.href));
  return { ...node, ...(node.marks ? { marks } : {}), ...(node.content ? { content: node.content.map(unlink) } : {}) };
}
/** 인쇄용 본문 저장소: 정해 둔 본문 하나만 읽고 고치지 않는다(새 쪽 시작은 미리보기가 블록 저장으로 따로 한다). */
function frozenStore(snapshot: RichBodySnapshot): RichBodyStore {
  return { initialSnapshot: snapshot, load: async () => snapshot, save: () => Promise.reject(new Error('인쇄 화면은 본문을 고치지 않습니다.')) };
}

/**
 * 문서 하나를 하위 페이지까지 이어 붙인 인쇄용 화면(PDF 내보내기). 서버가 아니라 이 브라우저가 PDF를 만든다: 표지·목차·문서마다
 * 종이 틀을 쌓고, 문서는 화면과 같은 페이지 나누기로 쪽을 정한 뒤 브라우저 인쇄(PDF로 저장)로 그대로 찍는다. 모든 쪽 설정은
 * 맨 위 문서의 것을 따르고, 쪽 번호는 표지·목차·앞 문서에 이어 매기며, 목차의 쪽 번호도 같은 배치에서 채운다.
 * 각 문서는 새 쪽에서 시작한다. 주소에 print=1이 있으면 준비되는 대로 인쇄 창을 열고, 인쇄를 마치면 이 창을 닫는다.
 */
export function DocumentPrintPage() {
  const { documentId } = useParams({ strict: false }) as { documentId: string };
  const client = useQueryClient();
  const session = useQuery(sessionOptions()).data;
  const view = useQuery(documentOptions(documentId));
  const doc = view.data?.document;
  const library = useQuery({ ...libraryOptions(doc?.projectKey ?? ''), enabled: !!doc?.projectKey });
  const entries = useMemo(() => doc && library.data
    ? flatten(doc.id, library.data.pages.some(page => page.id === doc.id) ? library.data.pages : [doc, ...library.data.pages], library.data.order.ids)
    : [], [doc, library.data]);
  // 원문 그대로 읽는다(블록 version까지): 새 쪽 시작을 블록 하나의 저장으로 고칠 때 쓴다. 내부 링크는 그릴 때 걷어 낸다.
  const stores = useMemo(() => new Map(entries.map(({ page }) => [page.id,
    documentBodyStore({ id: page.id, author: session?.name ?? '', canWrite: true, client, readerId: session?.id })])), [entries, session?.id, session?.name, client]);
  const bodies = useQueries({ queries: entries.map(({ page }) => ({ queryKey: printBodyKey(page.id), queryFn: () => stores.get(page.id)!.load(), staleTime: 60_000 })) });
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const hasPages = entries.length > 1;
  // 하위 문서가 있으면 표지와 문서 목차를, 문서 하나면 표지 없이 내는 것이 기본이다. 문서 하나의 목차는 본문 제목으로 만든다.
  const hasCover = flag(params, 'cover') ?? hasPages;
  const hasToc = flag(params, 'toc') ?? hasPages;
  const withHeadings = hasToc && (flag(params, 'headings') ?? !hasPages);
  const isAutoPrint = params.get('print') === '1';
  const rootBody = bodies[0]?.data?.body;
  const savedSetup = useMemo(() => rootBody?.attrs?.pageSetup ? pageSetupOf(rootBody) : DEFAULT_PAGE_SETUP, [rootBody]);
  const setup = useMemo(() => ({ ...savedSetup, gap: 0 }), [savedSetup]);
  const format = formatOf(setup);
  const [layouts, setLayouts] = useState<Record<string, PageLayout>>({});
  const [tocPages, setTocPages] = useState<TocRow[][] | null>(null);
  const isLoading = bodies.some(body => body.isPending);
  const root = useRef<HTMLDivElement>(null);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('document');
  const adjust = useAdjustments({ canWrite: !!view.data?.canWrite && !isAutoPrint, entries, bodies: bodies.map(body => body.data), stores, root });
  const hasError = bodies.some(body => body.isError);
  // 인쇄에서는 종이 폭이 화면 폭이 되어 휴대폰 폭 규칙(글자·단추 크기 토큰)과 넓은 화면의 기준 글자 확대가 바뀐다. 화면에서 잰 쪽
  // 나눔이 인쇄와 같도록 기준 글자를 16px로 두고, 화면에서 쓰던 토큰 값을 이 화면에 그대로 박아 둔다.
  useLayoutEffect(() => {
    const element = root.current, html = document.documentElement;
    if (!element) return undefined;
    const before = html.style.fontSize;
    html.style.fontSize = '16px';
    const computed = getComputedStyle(element);
    for (const name of PINNED_TOKENS) element.style.setProperty(name, computed.getPropertyValue(name));
    return () => { html.style.fontSize = before; };
  }, [doc]);

  // 목차 줄(쪽 번호 없이): 문서 제목, 그리고 고르면 그 아래 본문 제목(H2·H3). 본문 제목은 각 문서의 배치에서 읽는다.
  const tocRows = useMemo<TocRow[]>(() => !hasToc ? [] : entries.flatMap(({ page, depth }) => [
    { target: sectionTarget(page.id), text: page.title, depth, isHeading: false },
    ...(withHeadings ? (layouts[page.id]?.pages ?? []).flatMap(each => each.headings)
      .filter(heading => heading.blockId !== titleBlock(page.id) && heading.level >= 2 && heading.level <= 3 && heading.text.trim())
      .map(heading => ({ target: headingTarget(heading.blockId), text: heading.text.trim(), depth: depth + heading.level - 1, isHeading: true })) : []),
  ]), [hasToc, withHeadings, entries, layouts]);
  const isLaidOut = entries.length > 0 && entries.every(({ page }) => layouts[page.id]);

  // 쪽 번호: 표지·목차 다음부터 문서마다 이어 매긴다.
  const frontPages = (hasCover ? 1 : 0) + (hasToc ? tocPages?.length ?? 1 : 0);
  const offsets = new Map<string, number>();
  let next = frontPages;
  for (const { page } of entries) { offsets.set(page.id, next); next += layouts[page.id]?.count ?? 1; }
  const total = next;
  const pageOf = (row: TocRow) => {
    const entry = entries.find(({ page }) => row.target === sectionTarget(page.id) || (layouts[page.id]?.pages ?? []).some(each => each.headings.some(heading => headingTarget(heading.blockId) === row.target)));
    if (!entry) return undefined;
    const offset = offsets.get(entry.page.id) ?? 0;
    if (!row.isHeading) return offset + 1;
    const at = layouts[entry.page.id]?.pages.find(each => each.headings.some(heading => headingTarget(heading.blockId) === row.target));
    return at ? offset + at.number : undefined;
  };

  // 목차 줄을 종이 본문 높이에 맞게 쪽으로 나눈다. 숨은 칸에 실제 목차와 같은 모양(제목·줄 간격)으로 그려 놓고 각 줄의 위치로
  // 나눈다: 줄 높이만 더하면 줄 사이 간격이 빠져, 한 쪽에 들어간다고 본 줄이 인쇄에서 다음 쪽으로 넘쳤다(2026-11-11).
  const measure = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!hasToc || !measure.current) return;
    const contentHeight = format.height - format.marginTop - format.marginBottom - PRINT_SLACK;
    const pages: TocRow[][] = [[]];
    let pageTop = measure.current.getBoundingClientRect().top;
    measure.current.querySelectorAll<HTMLElement>('[data-toc-row]').forEach((element, index) => {
      const box = element.getBoundingClientRect();
      if (box.bottom - pageTop > contentHeight && pages.at(-1)!.length) { pages.push([]); pageTop = box.top; }
      pages.at(-1)!.push(tocRows[index]);
    });
    setTocPages(current => current && JSON.stringify(current) === JSON.stringify(pages) ? current : pages);
  }, [hasToc, tocRows, format.height, format.marginTop, format.marginBottom]);

  // 준비: 모든 본문·도표·사진이 그려지고, 문서마다 쪽 나눔이 정해진 뒤 잠시(0.8초) 그대로이면 찍는다.
  const [isDrawn, setDrawn] = useState(false);
  const richCount = bodies.reduce((sum, body) => sum + countNodes(body.data?.body, ['mermaidBlock', 'mathBlock', 'inlineMath', 'webEmbed']), 0);
  const mediaCount = bodies.reduce((sum, body) => sum + countNodes(body.data?.body, ['media']), 0);
  const [failure, setFailure] = useState('');
  useEffect(() => {
    if (!entries.length || isLoading || hasError) return undefined;
    let stopped = false;
    const giveUpAt = Date.now() + DRAW_LIMIT;
    const check = async () => {
      const node = root.current;
      node?.querySelectorAll('details').forEach(each => { each.open = true; });
      node?.querySelectorAll('img').forEach(img => { img.loading = 'eager'; });
      if (node?.querySelector('.rich-render-error, [data-media-state="error"]')) { setFailure('도표 또는 첨부를 표시하지 못했습니다.'); return; }
      const drawn = !!node && node.querySelectorAll('.ProseMirror').length >= entries.length
        && node.querySelectorAll('.rich-node').length >= richCount
        && node.querySelectorAll('.doc-media').length >= mediaCount
        && !node.querySelector('.rich-loading, [data-media-state="loading"], .link-card[data-loading]')
        && [...node.querySelectorAll('img')].every(img => img.complete);
      if (drawn) { await document.fonts.ready; if (!stopped) setDrawn(true); return; }
      if (Date.now() > giveUpAt) { setFailure('본문을 다 그리지 못했습니다. 창을 닫고 다시 시도해 주세요.'); return; }
      if (!stopped) window.setTimeout(() => void check(), 250);
    };
    void check();
    return () => { stopped = true; };
  }, [entries.length, isLoading, hasError, richCount, mediaCount]);
  const [isSettled, setSettled] = useState(false);
  const layoutKey = JSON.stringify(layouts);
  useEffect(() => {
    setSettled(false);
    if (!isDrawn || !isLaidOut) return undefined;
    const timer = window.setTimeout(() => setSettled(true), 800);
    return () => window.clearTimeout(timer);
  }, [isDrawn, isLaidOut, layoutKey, tocPages]);
  const isReady = isSettled && (!hasToc || !!tocPages);

  // 목차가 가리킬 본문 제목에 id를 붙인다.
  useEffect(() => {
    root.current?.querySelectorAll<HTMLElement>('.ProseMirror :is(h1, h2, h3)[data-block-id]').forEach(heading => {
      const blockId = heading.dataset.blockId!;
      heading.id = blockId.startsWith('print-title-') ? sectionTarget(blockId.slice('print-title-'.length)) : headingTarget(blockId);
    });
  }, [layoutKey]);

  useEffect(() => {
    if (!isReady || !isAutoPrint) return undefined;
    const close = () => window.close();
    window.addEventListener('afterprint', close);
    const timer = window.setTimeout(() => window.print(), 100);
    return () => { window.clearTimeout(timer); window.removeEventListener('afterprint', close); };
  }, [isReady, isAutoPrint]);
  // 종이는 흰색이다: 앱이 html에 칠하는 바탕색을 이 화면에서는 흰색으로 둔다(인쇄에 회색 바탕이 남지 않게).
  useEffect(() => {
    const html = document.documentElement, before = html.style.backgroundColor;
    html.style.backgroundColor = 'white';
    document.body.style.backgroundColor = 'white';
    return () => { html.style.backgroundColor = before; document.body.style.backgroundColor = ''; };
  }, []);
  // 표지와 PDF의 기본 파일 이름(탭 제목)은 문서 제목이다.
  const coverTitle = doc?.title;
  useEffect(() => { if (coverTitle) document.title = coverTitle; }, [coverTitle]);

  // 바뀐 본문·설정으로 문서마다 에디터를 새로 그려 다시 나눈다.
  const setupKey = JSON.stringify(savedSetup);

  if (view.isError) return <p className="p-8">문서를 찾을 수 없습니다.</p>;
  if (!doc || !library.data) return <p className="p-8 text-muted-foreground">문서를 준비하는 중…</p>;
  // 숨은 측정 칸은 종이 본문 폭, 표지는 종이 본문 높이다(종이 크기는 문서 설정에 따라 바뀐다).
  const measureBox = { inlineSize: `${(format.width - format.marginLeft - format.marginRight) / 16}rem` };
  const coverBox = { blockSize: `${(format.height - format.marginTop - format.marginBottom - PRINT_SLACK) / 16}rem` };
  const tocRow = (row: TocRow, page?: number) => <a key={row.target} href={`#${row.target}`} className={TOC_ROW} data-toc-row=""
    data-depth={Math.min(row.depth, 5)} data-heading={row.isHeading ? '' : undefined}>
    <span className="min-w-0 flex-[0_1_auto]">{row.text}</span>
    <span aria-hidden className="min-w-8 flex-[1_1_2rem] -translate-y-[0.3em] border-b border-dotted border-current opacity-50" />
    <span className="min-w-[3ch] flex-none text-right tabular-nums">{page ?? null}</span>
  </a>;
  const status = hasError ? '본문을 불러오지 못했습니다.' : failure || adjust.notice
    || (adjust.isSaving ? '저장하는 중…' : isReady ? (adjust.canAdjust ? '블록에 마우스를 올려 새 쪽에서 시작할 곳을 정하세요.' : '준비되었습니다.') : '쪽을 맞추는 중…');
  // 미리보기의 책상: 종이보다 은은하게 짙은 바탕. 인쇄에서는 칠하지 않는다.
  return <div ref={root} data-print-root="" data-render-all="" data-print-ready={isReady ? '' : undefined} data-print-error={hasError || failure ? status : undefined}
    onPointerMove={adjust.canAdjust ? adjust.hover : undefined} onPointerLeave={adjust.leave}
    className="relative box-border flex min-h-screen flex-col items-center gap-6 bg-[color-mix(in_oklab,var(--background),var(--foreground)_6%)] px-4 pt-6 pb-8 text-foreground print:block print:min-h-0 print:bg-transparent print:p-0">
    <style>{printPageRule(setup, hasCover || setup.differentFirstPage)}</style>
    {/* 머리 막대: 지금 상태와 페이지 설정 · PDF로 저장. 스크롤해도 위에 떠 있다. */}
    <div className="sticky top-4 z-30 box-border flex min-h-14 max-w-[calc(100%-1rem)] items-center gap-2 rounded-full border border-foreground/9 bg-linear-to-b from-popover to-background py-2 pr-2 pl-5 shadow-md print:hidden">
      <p role="status" className="min-w-0 text-sm">{status}</p>
      {adjust.canAdjust ? <Button variant="secondary" size="lg" className="rounded-full" aria-pressed={isSettingsOpen} onClick={() => setSettingsOpen(open => !open)}>페이지 설정</Button> : null}
      <Tooltip>
        <TooltipTrigger render={<Button size="lg" className="rounded-full" disabled={!isReady} onClick={() => window.print()} />}>PDF로 저장</TooltipTrigger>
        <TooltipContent>인쇄 창에서 대상을 'PDF로 저장'으로 고르세요</TooltipContent>
      </Tooltip>
    </div>
    {/* 블록 왼쪽 위에 뜨는 '여기부터 다음 쪽으로' 단추: 종이 왼쪽 여백 쪽으로 내민다. */}
    {/* check-ui: allow-style 단추 자리는 마우스 아래 블록의 화면 좌표(잰 값)다. */}
    {adjust.target ? <div style={adjust.target.place} className="absolute z-20 flex -translate-x-[calc(100%+0.5rem)] -translate-y-0.5 print:hidden">
      <Button variant="secondary" size="sm" disabled={adjust.isSaving} onClick={() => void adjust.toggle()}>
        {adjust.isSaving ? <Spinner data-icon="inline-start" /> : null}{adjust.target.isBreak ? '새 쪽 시작 해제' : '여기부터 다음 쪽으로'}
      </Button>
    </div> : null}
    {isSettingsOpen && adjust.canAdjust ? <SettingsDock>
      <DocumentSettings setup={adjust.draftSetup ?? savedSetup} onChange={adjust.changeSetup} tab={settingsTab} onTab={setSettingsTab} onClose={() => setSettingsOpen(false)} />
    </SettingsDock> : null}
    {/* 목차 줄 높이를 재는 숨은 칸(종이 본문 폭). */}
    {/* check-ui: allow-style 측정 칸의 폭은 문서 설정의 종이 본문 폭이다. */}
    {hasToc ? <div ref={measure} style={measureBox} aria-hidden className="invisible absolute top-0 -left-[625rem] flex flex-col gap-1 print:hidden">
      <h2 className={TOC_TITLE}>목차</h2>
      {tocRows.map(row => tocRow(row, 0))}
    </div> : null}
    {hasCover ? <div className={SHEET}>
      <PageCanvas setup={bare(setup)} layout={singlePage} numbering={{ offset: 0, total }}>
        {/* check-ui: allow-style 표지의 높이는 문서 설정의 종이 본문 높이다. */}
        <div style={coverBox} className="flex h-full flex-col justify-center gap-3">
          <h1 className="text-[2rem] leading-[1.3] font-bold">{coverTitle}</h1>
        </div>
      </PageCanvas>
    </div> : null}
    {hasToc ? (tocPages ?? [tocRows]).map((rows, index) => <nav key={`toc-${index}`} className={SHEET} aria-label={index === 0 ? '목차' : undefined}>
      <PageCanvas setup={setup} layout={singlePage} numbering={{ offset: (hasCover ? 1 : 0) + index, total }}>
        <div className="flex flex-col gap-1">
          {index === 0 ? <h2 className={TOC_TITLE}>목차</h2> : null}
          {rows.map(row => tocRow(row, pageOf(row)))}
        </div>
      </PageCanvas>
    </nav>) : null}
    {entries.map(({ page, depth }, index) => bodies[index]?.data ? <section key={page.id} className={SHEET} aria-label={page.title} data-print-doc={page.id}>
      <PrintedBody key={`${bodies[index].data!.version}:${setupKey}`} id={page.id} store={stores.get(page.id)!} snapshot={bodies[index].data!} title={page.title} depth={depth} setup={setup}
        numbering={{ offset: offsets.get(page.id) ?? 0, total }}
        onLayout={layout => setLayouts(current => JSON.stringify(current[page.id]) === JSON.stringify(layout) ? current : { ...current, [page.id]: layout })} />
    </section> : null)}
  </div>;
}

/**
 * 인쇄할 문서 본문: 출력용 사본(중복 제목·첫 블록 쪽 나눔 정리)의 맨 앞에 문서 제목을 제목 블록으로 넣어, 제목까지 같은 페이지
 * 나누기로 나눈다. 조판 중 다시 조회하지 않아 제목·인쇄 설정과 본문이 같은 버전에 속한다.
 */
function PrintedBody({ id, store, snapshot, title, depth, setup, numbering, onLayout }: {
  id: string; store: RichBodyStore; snapshot: RichBodySnapshot; title: string; depth: number; setup: PageSetup;
  numbering: { offset: number; total: number }; onLayout: (layout: PageLayout) => void;
}) {
  const frozen = useMemo(() => {
    const printed = printBody(snapshot.body ? unlink(snapshot.body) : null, title).body ?? { type: 'doc', content: [] };
    // 넓은 표는 종이 본문 폭에 맞춘다(테두리 몫 2px을 남긴다).
    const format = formatOf(setup);
    const body = fitTables(printed, format.width - format.marginLeft - format.marginRight - 2);
    const heading: JSONNode = { type: 'heading', attrs: { level: Math.min(depth + 1, 3), blockId: titleBlock(id) }, content: [{ type: 'text', text: title }] };
    const normalized = { ...snapshot, body: { ...body, content: [heading, ...(body.content ?? [])] } };
    return { ...frozenStore(normalized), attachments: store.attachments };
  }, [id, store, snapshot, title, depth, setup]);
  const { offset, total } = numbering;
  const print = useMemo(() => ({ setup, numbering: { offset, total }, onLayout }), [setup, offset, total, onLayout]);
  return <RichBody store={frozen} canEdit={false} title={title} print={print} />;
}
