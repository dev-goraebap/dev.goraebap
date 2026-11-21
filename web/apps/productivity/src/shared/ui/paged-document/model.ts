/**
 * 문서 쪽 나누기의 모델: 페이지 설정(문서와 함께 저장), 종이 모양, 그리고 페이지 나누기가 쓰는 px 크기(PDF 미리보기·인쇄).
 * 화면 부품과 페이지 나누기 확장은 이 파일의 타입만 공유한다. 문서 본문(JSON)은 페이지를 모른다.
 */

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

/**
 * PDF 인쇄의 @page 규칙: 용지·여백, 그리고 머리말·바닥글을 쪽 여백 상자로 둔다(쪽 번호는 인쇄의 counter). 화면의 종이 틀은 인쇄에서
 * 여백·머리말을 그리지 않고 이 규칙에 맡긴다: 인쇄의 글자 폭이 화면과 조금 달라 쪽이 하나 늘어도 번호가 어긋나지 않는다.
 * isFirstBare면 첫 쪽(표지)에는 머리말·바닥글을 두지 않는다. 빈 칸도 content를 비워 두어 브라우저의 머리글·바닥글이 붙지 않게 한다.
 */
export function printPageRule(setup: PageSetup, isFirstBare = setup.differentFirstPage): string {
  const [width, height] = paperSize(setup), { margins: m } = setup;
  const quote = (text: string) => text.split(/(\{page\}|\{total\})/).filter(Boolean)
    .map(part => part === '{page}' ? 'counter(page)' : part === '{total}' ? 'counter(pages)' : JSON.stringify(part)).join(' ') || '""';
  const style = 'font-family: "Pretendard Variable", Pretendard, sans-serif; font-size: 9pt; color: gray;';
  const box = (name: string, text: string, align: string, distance: string) =>
    `@${name} { content: ${text ? quote(text) : '""'}; ${style} text-align: ${align}; ${distance} }`;
  const top = `vertical-align: top; padding-top: ${setup.headerDistance}mm;`, bottom = `vertical-align: bottom; padding-bottom: ${setup.footerDistance}mm;`;
  const boxes = [box('top-left', setup.header.left, 'left', top), box('top-center', '', 'center', top), box('top-right', setup.header.right, 'right', top),
    box('bottom-left', setup.footer.left, 'left', bottom), box('bottom-center', setup.footer.center, 'center', bottom), box('bottom-right', setup.footer.right, 'right', bottom)].join(' ');
  const bare = ['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'].map(name => `@${name} { content: ""; }`).join(' ');
  return `@page { size: ${width}mm ${height}mm; margin: ${m.top}mm ${m.right}mm ${m.bottom}mm ${m.left}mm; ${boxes} }`
    + (isFirstBare ? ` @page :first { ${bare} }` : '');
}

/** 숫자면 그 값, 아니면 기본값. */
const numberOr = (value: unknown, fallback: number) => typeof value === 'number' && Number.isFinite(value) ? value : fallback;
const textOr = (value: unknown, fallback: string) => typeof value === 'string' ? value : fallback;

const recordOr = (value: unknown): Record<string, unknown> => (value && typeof value === 'object' ? value as Record<string, unknown> : {});

/**
 * 본문 루트의 attrs.pageSetup에서 페이지 설정을 읽는다(cowork는 페이지 설정을 본문과 함께 저장한다: 버전 기록·PDF가 본문과 같이 가진다).
 * 없거나 모르는 값은 기본값으로 채운다.
 */
export function pageSetupOf(body: { attrs?: Record<string, unknown> } | null | undefined): PageSetup {
  const saved = recordOr(body?.attrs?.pageSetup), base = DEFAULT_PAGE_SETUP;
  const margins = recordOr(saved.margins), header = recordOr(saved.header), footer = recordOr(saved.footer);
  return {
    paper: typeof saved.paper === 'string' && saved.paper in PAPERS ? saved.paper as keyof typeof PAPERS : base.paper,
    orientation: saved.orientation === 'landscape' ? 'landscape' : 'portrait',
    margins: { top: numberOr(margins.top, base.margins.top), bottom: numberOr(margins.bottom, base.margins.bottom),
      left: numberOr(margins.left, base.margins.left), right: numberOr(margins.right, base.margins.right) },
    gap: numberOr(saved.gap, base.gap),
    header: { left: textOr(header.left, base.header.left), right: textOr(header.right, base.header.right) },
    footer: { left: textOr(footer.left, base.footer.left), center: textOr(footer.center, base.footer.center), right: textOr(footer.right, base.footer.right) },
    headerDistance: numberOr(saved.headerDistance, base.headerDistance), footerDistance: numberOr(saved.footerDistance, base.footerDistance),
    differentFirstPage: saved.differentFirstPage === true,
  };
}

/** 본문 루트에 페이지 설정을 둔다. setup이 null이면(한 번도 고치지 않은 문서) 본문을 그대로 둔다. */
export function withPageSetup<T extends { attrs?: Record<string, unknown> }>(body: T, setup: PageSetup | null): T {
  return setup ? { ...body, attrs: { ...body.attrs, pageSetup: setup } } : body;
}
