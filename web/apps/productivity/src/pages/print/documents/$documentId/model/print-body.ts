import type { JSONNode } from '@/shared/lib/rich-document';

const textOf = (node: JSONNode): string => node.text ?? node.content?.map(textOf).join('') ?? '';
const text = (value: string) => value.replace(/\s+/g, ' ').trim();

/** 편집기가 폭을 정하지 않은 열에 주는 최소 폭(px, ResizableTable의 cellMinWidth). */
const CELL_MIN_WIDTH = 120;

/**
 * 종이 본문(available px)보다 넓은 표의 열 폭을 비율대로 줄여 출력용 사본에 적는다. 편집기는 열 폭(늘려 둔 열, 정하지 않은 열의 최소
 * 폭)으로 표의 최소 너비를 정해 넘치면 가로로 스크롤하는데, 종이에는 스크롤이 없어 그대로면 표가 종이 밖으로 나가 잘린다. 모든 열에
 * 폭을 적으면 편집기는 그 합을 표 너비로 쓴다(최소 폭보다 좁아도). 행마다 칸을 차례로 열에 놓는다(rowspan은 따지지 않는다).
 */
export function fitTables(node: JSONNode, available: number): JSONNode {
  if (node.type === 'table' && node.content?.length) {
    const first = node.content[0].content ?? [];
    const widths = first.flatMap(cell => {
      const span = Number(cell.attrs?.colspan) || 1, given = (cell.attrs?.colwidth ?? []) as (number | null)[];
      return Array.from({ length: span }, (_, at) => Number(given[at]) || CELL_MIN_WIDTH);
    });
    const total = widths.reduce((sum, width) => sum + width, 0);
    if (total > available) {
      const fitted = widths.map(width => Math.max(1, Math.floor(width * available / total)));
      return { ...node, content: node.content.map(row => {
        let column = 0;
        return { ...row, content: row.content?.map(cell => {
          const span = Number(cell.attrs?.colspan) || 1;
          const colwidth = Array.from({ length: span }, (_, at) => fitted[column + at] ?? Math.floor(available / widths.length));
          column += span;
          return { ...cell, attrs: { ...cell.attrs, colwidth } };
        }) };
      }) };
    }
    return node;
  }
  return node.content ? { ...node, content: node.content.map(child => fitTables(child, available)) } : node;
}

/** 원문은 보존하고 출력용 사본에서 중복 제목과 첫 블록의 쪽 나눔만 정리한다. */
export function printBody(value: JSONNode | null | undefined, title: string) {
  if (!value) return { body: null, startsNewPage: false };
  const body = structuredClone(value);
  let startsNewPage = body.attrs?.printStartOnNewPage === true;
  if (body.attrs) delete body.attrs.printStartOnNewPage;
  const meaningful = () => body.content?.findIndex(node => node.type !== 'paragraph' || text(textOf(node))) ?? -1;
  const first = meaningful();
  const leading = body.content?.[first];
  if (leading?.type === 'heading' && text(textOf(leading)) === text(title)) {
    startsNewPage ||= leading.attrs?.printBreakBefore === true;
    body.content!.splice(first, 1);
  }
  const head = body.content?.[meaningful()];
  if (head?.attrs?.printBreakBefore === true) {
    startsNewPage = true;
    head.attrs.printBreakBefore = null;
  }
  const headings = (node: JSONNode) => {
    if (node.type === 'heading' && Number(node.attrs?.level) === 1) node.attrs = { ...node.attrs, level: 2 };
    node.content?.forEach(headings);
  };
  headings(body);
  return { body, startsNewPage };
}
