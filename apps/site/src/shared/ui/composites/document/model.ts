/**
 * 문서 편집기의 모델: 보기 모드, 페이지 설정(문서와 함께 저장), 페이지 모양(보는 사람의 화면 설정), 그리고 페이지 나누기가 쓰는 px 크기.
 * 화면 부품과 페이지 나누기 확장은 이 파일의 타입만 공유한다. 문서 본문(JSON)은 페이지를 모른다.
 */

/** 페이지(나눠 보기)와 페이지 없음(나누지 않고 한 열로 이어 보기). */
export type DocumentMode = 'pages' | 'pageless';

/** 1mm의 CSS px(96dpi). */
export const MM = 96 / 25.4;

/** 용지 크기(mm, 세로 기준). */
export const PAPERS = { A4: { width: 210, height: 297 }, A5: { width: 148, height: 210 }, Letter: { width: 215.9, height: 279.4 } } as const;
export type Paper = keyof typeof PAPERS;

/**
 * 문서의 페이지 설정: 용지·방향·여백(mm)·페이지 사이 간격(px), 머리말(왼쪽·오른쪽)·바닥글(왼쪽·가운데·오른쪽)과 가장자리에서의 거리(mm).
 * 머리말·바닥글 글에는 {page}(이 페이지 번호)와 {total}(전체 페이지 수)을 쓸 수 있다. 본문과 따로 저장한다:
 * 같은 본문을 다른 용지로 다시 나눌 수 있다.
 */
export type PageSetup = {
  paper: Paper;
  orientation: 'portrait' | 'landscape';
  margins: { top: number; bottom: number; left: number; right: number };
  gap: number;
  header: { left: string; right: string };
  footer: { left: string; center: string; right: string };
  headerDistance: number;
  footerDistance: number;
  /** 첫 페이지(표지)에는 머리말·바닥글을 두지 않는다. */
  differentFirstPage: boolean;
};

export const DEFAULT_PAGE_SETUP: PageSetup = {
  paper: 'A4', orientation: 'portrait', margins: { top: 25, bottom: 25, left: 22, right: 22 }, gap: 24,
  header: { left: '', right: '' }, footer: { left: '', center: '', right: '{page} / {total}' }, headerDistance: 12, footerDistance: 12,
  differentFirstPage: false,
};

/**
 * 페이지 보기의 모양(보는 사람의 화면 설정, 문서에는 저장하지 않는다).
 * tinted: 바깥(상세 안에서는 페이지 자체)을 테마에 맞춰 아주 옅게 다른 색으로 두어 바탕색 차이로 페이지를 가른다.
 * divider: 같은 바탕에 페이지 사이에만 가로선을 둔다(line: 실선·점선·점·물결).
 */
export type PageLook = { style: 'tinted' | 'divider'; line: 'solid' | 'dashed' | 'dotted' | 'wavy' };
export const DEFAULT_PAGE_LOOK: PageLook = { style: 'tinted', line: 'solid' };

/** 페이지 크기와 여백(CSS px, 기준 글자 16px). 페이지 나누기와 종이 틀이 쓴다. name이 같으면 같은 배치다. */
export type PageFormat = { name: string; width: number; height: number; marginTop: number; marginBottom: number; marginLeft: number; marginRight: number; gap: number };

/** 방향을 반영한 용지 크기(mm). */
function paperSize(setup: PageSetup): [width: number, height: number] {
  const paper = PAPERS[setup.paper];
  return setup.orientation === 'portrait' ? [paper.width, paper.height] : [paper.height, paper.width];
}

/** 페이지 설정을 페이지 나누기·종이 틀이 쓰는 px 크기로 바꾼다. */
export function formatOf(setup: PageSetup): PageFormat {
  const [width, height] = paperSize(setup), { margins: m } = setup;
  return {
    name: `${setup.paper}-${setup.orientation}-${m.top}-${m.bottom}-${m.left}-${m.right}`,
    width: width * MM, height: height * MM, gap: setup.gap,
    marginTop: m.top * MM, marginBottom: m.bottom * MM, marginLeft: m.left * MM, marginRight: m.right * MM,
  };
}

/** 머리말·바닥글 글의 {page}·{total}을 채운다. */
export const fillPageTokens = (text: string, page: number, total: number) => text.replaceAll('{page}', String(page)).replaceAll('{total}', String(total));

/** 인쇄용 @page 규칙: 용지·여백과 머리말·바닥글(쪽 번호는 인쇄의 counter로). 종이 틀이 <style>로 넣는다. */
export function printPageRule(setup: PageSetup): string {
  const [width, height] = paperSize(setup), { margins: m } = setup;
  const quote = (text: string) => text.split(/(\{page\}|\{total\})/).filter(Boolean)
    .map(part => part === '{page}' ? 'counter(page)' : part === '{total}' ? 'counter(pages)' : JSON.stringify(part)).join(' ') || '""';
  const box = (name: string, text: string) => text ? `@${name} { content: ${quote(text)}; font-size: 9pt; color: #666; }` : '';
  const boxes = [box('top-left', setup.header.left), box('top-right', setup.header.right), box('bottom-left', setup.footer.left),
    box('bottom-center', setup.footer.center), box('bottom-right', setup.footer.right)].join(' ');
  const bare = ['top-left', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'].map(name => `@${name} { content: none }`).join(' ');
  return `@page document-page { size: ${width}mm ${height}mm; margin: ${m.top}mm ${m.right}mm ${m.bottom}mm ${m.left}mm; ${boxes} }`
    + (setup.differentFirstPage ? ` @page document-page:first { ${bare} }` : '');
}
