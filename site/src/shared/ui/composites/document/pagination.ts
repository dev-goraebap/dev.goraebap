import { Extension } from '@tiptap/core';
import type { Node as PMNode } from '@tiptap/pm/model';
import { Plugin, PluginKey, type EditorState, type Transaction } from '@tiptap/pm/state';
import { Decoration, DecorationSet, type EditorView } from '@tiptap/pm/view';
import { DEFAULT_PAGE_SETUP, formatOf, type PageFormat } from './model';

type Heading = { blockId: string; text: string; level: number };
/** 한 페이지: 번호(1부터), 그 페이지를 대표하는 제목(페이지에서 시작한 첫 제목, 없으면 앞에서 이어지는 제목), 페이지에서 시작한 제목들. */
export type PageInfo = { number: number; heading?: Heading; continues: boolean; headings: Heading[] };
/** 배치 결과. oversized는 한 페이지보다 커서 나눌 수 없어 페이지를 넘겨 그린 블록의 blockId다. */
export type PageLayout = { count: number; pages: PageInfo[]; oversized: string[] };

/**
 * 페이지 나눔 하나. block: pos의 블록(맨 위 블록·목록 항목) 앞에 margin만 가진 빈 상자를 둔다. row: 표 행 앞에 그 높이의 빈 행을 둔다.
 * line: 문단 안 pos의 줄 앞에 그 높이의 빈 줄을 두어 문단을 두 페이지에 걸쳐 잇는다.
 */
type Break = { kind: 'block' | 'row' | 'line'; pos: number; size: number };
type State = { breaks: Break[]; decorations: DecorationSet; version: number };
export const paginationKey = new PluginKey<State>('pagination');
const refreshMeta = 'paginationRefresh';
/** 용지·여백처럼 배치 조건이 바뀌었을 때 다시 나눈다(문서는 그대로라 에디터를 새로 만들지 않는다). */
export const refreshPagination = (view: EditorView) => view.dispatch(view.state.tr.setMeta(refreshMeta, true).setMeta('addToHistory', false));

const LIST_TYPES = new Set(['bulletList', 'orderedList', 'taskList']);
type Unit = { pos: number; node: PMNode; kind: 'block' | 'row' };

/** 페이지를 재는 단위: 맨 위 블록, 목록은 항목, 표는 행. 길어도 항목·행 사이에서 페이지를 넘길 수 있게 한다. */
function unitsOf(doc: PMNode): Unit[] {
  const out: Unit[] = [];
  doc.forEach((node, offset) => {
    if (LIST_TYPES.has(node.type.name) && node.childCount > 1) node.forEach((item, inner) => out.push({ pos: offset + 1 + inner, node: item, kind: 'block' }));
    else if (node.type.name === 'table' && node.childCount > 1) node.forEach((row, inner) => out.push({ pos: offset + 1 + inner, node: row, kind: 'row' }));
    else out.push({ pos: offset, node, kind: 'block' });
  });
  return out;
}

function gapElement(item: Break, columns: number): HTMLElement {
  if (item.kind === 'row') {
    // 표 안에서는 margin이 듣지 않는다: 그 높이의 빈 행을 넣고 칸 테두리는 지운다.
    const row = document.createElement('tr'), cell = document.createElement('td');
    row.className = 'pg-gap pg-row-gap';
    cell.colSpan = Math.max(1, columns);
    cell.style.height = `${item.size}px`;
    row.append(cell);
    return row;
  }
  const gap = document.createElement(item.kind === 'line' ? 'span' : 'div');
  gap.className = item.kind === 'line' ? 'pg-gap pg-line-gap' : 'pg-gap';
  // 높이 없는 빈 상자의 margin은 앞뒤 블록의 margin과 겹친다(margin 상쇄). 그래서 이 값이 두 블록 사이의 간격 전체가 된다.
  if (item.kind === 'block') gap.style.marginBlockStart = `${item.size}px`;
  else gap.style.blockSize = `${item.size}px`;
  return gap;
}

function decorate(doc: PMNode, breaks: Break[]): DecorationSet {
  const found = breaks.flatMap(item => {
    const node = item.kind === 'line' ? null : doc.nodeAt(item.pos);
    if (item.kind !== 'line' && !node) return [];
    const columns = item.kind === 'row' ? node!.childCount : 1;
    const widget = Decoration.widget(item.pos, () => {
      const gap = gapElement(item, columns);
      gap.setAttribute('contenteditable', 'false');
      gap.setAttribute('aria-hidden', 'true');
      return gap;
    }, { side: -1, key: `pg-${item.kind}-${item.pos}-${Math.round(item.size)}-${columns}`, ignoreSelection: true });
    // 인쇄에서는 간격 대신 이 블록·행 앞에서 페이지를 넘긴다. 문단 안의 줄 나눔은 인쇄가 알아서 한다(document.module.css).
    return node ? [widget, Decoration.node(item.pos, item.pos + node.nodeSize, { class: 'pg-start' })] : [widget];
  });
  return DecorationSet.create(doc, found);
}

/**
 * 에디터 본문을 페이지 좌표(기준 글자 16px의 px, 본문 맨 위가 0)로 재는 도구. 좁은 화면에서 종이를 CSS zoom으로 줄이면 화면 좌표도
 * 줄어드므로 배율로 되돌린다. 배율은 폭이 정확히 페이지 폭인 종이 틀에서 구한다(offsetHeight는 정수로 반올림되어 페이지가 쌓일수록 어긋난다).
 */
function measurer(view: EditorView, format: PageFormat) {
  const box = (view.dom as HTMLElement).getBoundingClientRect();
  const canvas = (view.dom as HTMLElement).closest<HTMLElement>('[data-page-count]')?.getBoundingClientRect().width;
  const scale = canvas ? canvas / format.width : 1;
  const toLocal = (y: number) => (y - box.top) / scale;
  return {
    rect: (dom: HTMLElement) => { const rect = dom.getBoundingClientRect(); return { top: toLocal(rect.top), bottom: toLocal(rect.bottom) }; },
    /** pos 글자 자리의 위·아래(줄 상자가 아니라 글자 상자). 화면 밖에서도 맞다(posAtCoords는 보이는 곳에서만 맞다). */
    char: (pos: number) => { const at = view.coordsAtPos(pos, 1); return { top: toLocal(at.top), bottom: toLocal(at.bottom) }; },
  };
}
type Measure = ReturnType<typeof measurer>;

/** 문단의 줄 높이(px). normal이면 글자 크기의 1.2배로 본다. */
function lineHeightOf(dom: HTMLElement): number {
  const style = getComputedStyle(dom), value = parseFloat(style.lineHeight);
  return Number.isFinite(value) ? value : parseFloat(style.fontSize) * 1.2;
}

/** 이 줄 수 이하의 문단은 나누지 않고 통째로 넘긴다(짧은 문단이 두 페이지에 흩어지지 않게). */
const SHORT_PARAGRAPH_LINES = 3;

/**
 * 긴 문단을 줄 단위로 나눈다: 페이지 본문 끝(limit)에 걸친 줄의 첫 글자를 찾아 그 줄부터 다음 페이지 첫머리로 보내고, 남은 부분이 또 넘치면
 * 되풀이한다. 첫 페이지에 한 줄만 남게 되면(외톨이 줄) 나누지 않는다. 나눴으면 넣은 줄 간격과 늘어난 이동량을, 아니면 null을 돌려준다.
 */
function splitParagraph(measure: Measure, unit: Unit, bottom: number, shift: number, limit: number, stride: number, content: number):
  { breaks: Break[]; shift: number } | null {
  const first = unit.pos + 1, last = unit.pos + unit.node.nodeSize - 1;
  const search = (from: number, to: number, isPast: (pos: number) => boolean) => {
    let low = from, high = to;
    while (low < high) { const middle = (low + high) >> 1; if (isPast(middle)) high = middle; else low = middle + 1; }
    return low;
  };
  const breaks: Break[] = [];
  let start = first;
  for (let guard = 0; guard < 50 && bottom + shift > limit + 0.5; guard += 1) {
    // 아래 끝이 페이지 본문 끝을 넘는 첫 글자 → 그 글자가 있는 줄의 첫 글자.
    const over = search(start, last, pos => measure.char(pos).bottom + shift > limit + 0.5);
    if (over >= last) break;
    const lineTop = measure.char(over).top;
    const lineStart = search(start, over, pos => measure.char(pos).top >= lineTop - 1);
    const top = lineTop + shift;
    if (lineStart <= first || top <= limit - content + 0.5) break;
    const firstLine = measure.char(start);
    if (!breaks.length && lineTop - firstLine.top < 1.5 * (firstLine.bottom - firstLine.top)) break;
    const target = Math.floor(top / stride + 1) * stride;
    breaks.push({ kind: 'line', pos: lineStart, size: target - top });
    shift += target - top;
    limit = target + content; start = lineStart;
  }
  return breaks.length ? { breaks, shift } : null;
}

const sameBreaks = (a: Break[], b: Break[]) => a.length === b.length
  && a.every((each, index) => each.kind === b[index].kind && each.pos === b[index].pos && Math.abs(each.size - b[index].size) < 1);

/**
 * 간격을 모두 숨긴 채로 블록을 재고(자연 배치), 맨 위부터 페이지에 채운다. 페이지 본문 끝을 넘는 단위는 다음 페이지 첫머리로 민다.
 * 여러 줄 문단은 넘치는 줄부터 다음 페이지로 보내 두 페이지에 잇는다. 간격을 빼고 재므로 같은 입력이면 같은 결과가 나와 되풀이가 멈춘다.
 */
function layout(view: EditorView, format: PageFormat): { breaks: Break[]; result: PageLayout } {
  const root = view.dom as HTMLElement;
  const stride = format.height + format.gap, content = format.height - format.marginTop - format.marginBottom;
  const units = unitsOf(view.state.doc);
  root.classList.add('pg-measuring');
  const measure = measurer(view, format);

  const breaks: Break[] = [], oversized: string[] = [];
  const pages: PageInfo[] = [{ number: 1, continues: false, headings: [] }];
  const pageAt = (top: number) => Math.floor(top / stride) + 1;
  const ensure = (number: number) => { while (pages.length < number) pages.push({ number: pages.length + 1, continues: true, headings: [] }); };
  let shift = 0, previousBottom = 0, hasPrevious = false, lastBottom = 0;
  // 바로 앞 단위가 아직 밀리지 않은 제목이면 그 자리를 기억한다: 본문을 다음 페이지로 밀 때 제목도 함께 민다(제목만 페이지 끝에 남지 않게).
  let heading: { pos: number; top: number; gapBefore: number; page: number } | null = null;
  for (const unit of units) {
    const dom = view.nodeDOM(unit.pos);
    if (!(dom instanceof HTMLElement)) continue;
    const { top: naturalTop, bottom: naturalBottom } = measure.rect(dom), height = naturalBottom - naturalTop;
    const isLongParagraph = unit.node.type.name === 'paragraph' && height > SHORT_PARAGRAPH_LINES * lineHeightOf(dom) + 1;
    if (height <= 0 && unit.node.type.name !== 'horizontalRule') continue;
    let top = naturalTop + shift;
    const page = Math.floor(top / stride), pageBottom = page * stride + content;
    const startsInGap = top - page * stride > content - 0.5;
    const overflows = top + height > pageBottom + 0.5 && top - page * stride > 0.5;
    const push = (target: number) => {
      if (heading && heading.page === page) {
        // 제목을 다음 페이지 첫머리로 보내고, 본문은 제목 뒤에 이어 둔다(본문 앞에는 간격을 두지 않는다).
        breaks.push({ kind: 'block', pos: heading.pos, size: Math.max(0, heading.gapBefore) + (target - heading.top) });
        shift += target - heading.top;
        top = naturalTop + shift;
        // 페이지 목록의 제목도 다음 페이지로 옮긴다.
        const moved = pages[heading.page]?.headings.pop();
        ensure(heading.page + 2);
        if (moved) pages[heading.page + 1].headings.unshift(moved);
        heading = null;
        return;
      }
      const naturalGap = unit.kind === 'row' ? 0 : naturalTop - previousBottom;
      breaks.push({ kind: unit.kind, pos: unit.pos, size: unit.kind === 'row' ? target - top : Math.max(0, naturalGap) + (target - top) });
      shift += target - top;
      top = target;
    };
    if (hasPrevious && startsInGap) push((page + 1) * stride);
    else if (overflows && isLongParagraph) {
      const split = splitParagraph(measure, unit, naturalBottom, shift, pageBottom, stride, content);
      if (split) { breaks.push(...split.breaks); shift = split.shift; } else if (hasPrevious) push((page + 1) * stride);
    } else if (hasPrevious && overflows) push((page + 1) * stride);
    if (height > content) oversized.push(String(unit.node.attrs.blockId ?? unit.pos));
    ensure(pageAt(top));
    if (unit.node.type.name === 'heading') pages[pageAt(top) - 1].headings.push({ blockId: String(unit.node.attrs.blockId ?? ''), text: unit.node.textContent, level: Number(unit.node.attrs.level) });
    heading = unit.node.type.name === 'heading' && unit.kind === 'block'
      ? { pos: unit.pos, top, gapBefore: naturalTop - previousBottom, page: Math.floor(top / stride) } : null;
    previousBottom = naturalBottom; hasPrevious = true;
    lastBottom = Math.max(lastBottom, naturalBottom + shift);
  }
  root.classList.remove('pg-measuring');
  ensure(Math.floor(Math.max(0, lastBottom - 1) / stride) + 1);
  // 각 페이지의 대표 제목: 그 페이지에서 시작한 첫 제목, 없으면 앞 페이지에서 이어지는 마지막 제목.
  let current: Heading | undefined;
  for (const page of pages) {
    if (page.headings.length) { page.heading = page.headings[0]; page.continues = false; current = page.headings[page.headings.length - 1]; }
    else { page.heading = current; page.continues = page.number > 1; }
  }
  return { breaks, result: { count: pages.length, pages, oversized } };
}

const breakKey = (item: Break) => `${item.kind}:${item.pos}`;

/**
 * 간격을 넣은 뒤의 실제 자리를 재어, 넘긴 블록·행·줄이 페이지 본문 첫머리에서 얼마나 어긋났는지 돌려준다. margin 상쇄를 추정한 값이
 * 실제 배치와 조금 다를 수 있어(앞 블록의 margin 등) 그 차이를 다음 배치에 보정한다.
 */
function misplacement(view: EditorView, format: PageFormat, breaks: Break[]): Map<string, number> {
  const stride = format.height + format.gap, measure = measurer(view, format);
  const out = new Map<string, number>();
  for (const item of breaks) {
    let local: number | undefined;
    if (item.kind === 'line') { try { local = measure.char(item.pos).top; } catch { local = undefined; } }
    else { const dom = view.nodeDOM(item.pos); if (dom instanceof HTMLElement) local = measure.rect(dom).top; }
    if (local === undefined) continue;
    const delta = local - Math.round(local / stride) * stride;
    if (Math.abs(delta) > 0.25) out.set(breakKey(item), delta);
  }
  return out;
}

/** format은 값이나 지금 값을 돌려주는 함수다(함수면 refreshPagination으로 바뀐 값으로 다시 나눈다). */
export type PaginationOptions = { format: PageFormat | (() => PageFormat); onLayout: (layout: PageLayout) => void };

/**
 * 페이지 나누기(화면 배치 층). 문서 데이터는 바꾸지 않고, 페이지 끝을 넘는 블록 앞에 간격 장식만 둔다. 종이 틀(PageCanvas)은
 * onLayout의 페이지 수로 그린다. 블록이 바뀌거나 크기가 바뀌면(사진·도표가 늦게 그려질 때) 다음 프레임에 다시 잰다.
 * 한 페이지보다 큰 블록(도표·코드·그림)은 나누지 않고 페이지를 넘겨 그린 뒤 oversized로 알린다(배치가 멈추지 않게 다시 밀지 않는다).
 */
export const Pagination = Extension.create<PaginationOptions>({
  name: 'pagination',
  addOptions: () => ({ format: formatOf(DEFAULT_PAGE_SETUP), onLayout: () => undefined }),
  addProseMirrorPlugins() {
    const options = this.options;
    const formatNow = () => typeof options.format === 'function' ? options.format() : options.format;
    return [new Plugin<State>({
      key: paginationKey,
      state: {
        init: (_, state: EditorState) => ({ breaks: [], decorations: DecorationSet.create(state.doc, []), version: 0 }),
        apply: (tr: Transaction, value: State): State => {
          const next = tr.getMeta(paginationKey) as Break[] | undefined;
          if (next) return { breaks: next, decorations: decorate(tr.doc, next), version: value.version };
          if (tr.getMeta(refreshMeta)) return { ...value, version: value.version + 1 };
          if (!tr.docChanged) return value;
          const breaks = value.breaks.map(each => ({ ...each, pos: tr.mapping.map(each.pos, 1) }))
            .filter(each => each.kind === 'line' ? each.pos <= tr.doc.content.size : !!tr.doc.nodeAt(each.pos));
          return { breaks, decorations: decorate(tr.doc, breaks), version: value.version };
        },
      },
      props: { decorations: state => paginationKey.getState(state)?.decorations },
      view: view => {
        let frame = 0, isGone = false;
        // 넘긴 자리마다 실제 배치와의 차이를 기억해 다음 배치의 간격에서 뺀다(같은 자리가 이어지는 동안만).
        let corrections = new Map<string, number>();
        const run = () => {
          frame = 0;
          // 인쇄하는 동안에는 종이 폭이 화면 폭이 되어 다시 재면 화면의 나눔이 무너진다. 화면의 나눔 그대로 인쇄한다.
          if (isGone || !view.dom.isConnected || matchMedia('print').matches) return;
          const { breaks: planned, result } = layout(view, formatNow());
          options.onLayout(result);
          corrections = new Map([...corrections].filter(([key]) => planned.some(item => breakKey(item) === key)));
          const corrected = (list: Break[]) => list.map(item => ({ ...item, size: Math.max(0, item.size - (corrections.get(breakKey(item)) ?? 0)) }));
          let breaks = corrected(planned);
          const current = paginationKey.getState(view.state)?.breaks ?? [];
          if (sameBreaks(current, breaks)) {
            // 배치가 그대로면 실제 자리를 재어 어긋난 만큼 보정한다. 보정이 생기면 한 번 더 그린다.
            const off = misplacement(view, formatNow(), current);
            if (!off.size) return;
            off.forEach((delta, key) => corrections.set(key, (corrections.get(key) ?? 0) + delta));
            breaks = corrected(planned);
          }
          if (!sameBreaks(current, breaks)) view.dispatch(view.state.tr.setMeta(paginationKey, breaks).setMeta('addToHistory', false));
        };
        const schedule = () => { if (!frame) frame = requestAnimationFrame(run); };
        // 사진·도표·글꼴이 늦게 들어와 높이가 바뀌어도 다시 잰다. 간격만 바뀐 것은 결과가 같아 멈춘다.
        const resize = new ResizeObserver(schedule);
        resize.observe(view.dom);
        void document.fonts?.ready.then(schedule);
        schedule();
        return {
          update: (next, previous) => {
            if (!next.state.doc.eq(previous.doc) || paginationKey.getState(next.state)?.version !== paginationKey.getState(previous)?.version) schedule();
          },
          destroy: () => { isGone = true; resize.disconnect(); if (frame) cancelAnimationFrame(frame); },
        };
      },
    })];
  },
});
