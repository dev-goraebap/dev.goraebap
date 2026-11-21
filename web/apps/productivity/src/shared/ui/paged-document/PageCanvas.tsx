import type { CSSProperties, ReactNode } from 'react';
import { Button } from '@/shared/ui/kit/button';
import { PenSquareIcon } from '@/shared/ui/kit/icon';
import { MM, fillPageTokens, formatOf, type PageLook, type PageSetup } from './model';
import type { PageLayout } from './pagination';

export type PageArea = 'header' | 'footer';
/** 여러 문서를 이어 찍을 때(PDF)의 쪽 번호: 이 종이 틀 앞에 온 쪽 수와 전체 쪽 수. */
export type PageNumbering = { offset: number; total: number };

/** 물결 구분선의 무늬(16 × 6 SVG). 선 색은 바탕(bg-input)이고 무늬는 가리개(mask)라 테마 색을 따른다. */
const WAVE = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='6' viewBox='0 0 16 6'%3E%3Cpath d='M0 3 Q4 0 8 3 T16 3' fill='none' stroke='black' stroke-width='1.25'/%3E%3C/svg%3E\") repeat-x 0 0 / 16px 6px";
/** 종이 틀: 본문 폭은 종이 폭에서 좌우 여백을 뺀 것이다. 본문 쪽 간격과 인쇄 규칙은 편집기 규칙(rich-document/styles.css의 [data-paged-canvas])에 있다. */
const CANVAS = 'relative box-border min-h-(--pg-total) w-(--pg-width) flex-none pt-(--pg-margin-top) pr-(--pg-margin-right) pb-(--pg-margin-bottom) pl-(--pg-margin-left) [&>:not([data-sheets])]:relative [&>:not([data-sheets])]:z-1';
/**
 * 머리말 · 바닥글: 종이 위 · 아래 여백 전체가 영역이고 글은 가장자리에서 정한 거리에 놓인다. 고칠 수 있으면 올렸을 때(또는 고치는 중일 때)
 * 본문과의 경계에 점선, 영역에 옅은 바탕, 경계 위 오른쪽에 연필 단추가 보인다. 빈 영역은 올렸을 때만 "머리말 추가"가 보인다.
 */
const AREA = 'group/area pointer-events-auto absolute inset-x-0 box-border flex justify-between gap-3 border-dashed border-transparent pr-(--pg-margin-right) pl-(--pg-margin-left) '
  + 'text-xs text-muted-foreground data-editable:cursor-text data-editable:hover:border-input data-editable:hover:bg-[color-mix(in_oklab,transparent,var(--foreground)_3%)] '
  + 'data-editable:data-active:border-input data-editable:data-active:bg-[color-mix(in_oklab,transparent,var(--foreground)_3%)]';
const REVEAL = 'opacity-0 group-focus-within/area:opacity-100 group-hover/area:opacity-100 group-data-active/area:opacity-100';

/**
 * 페이지 보기의 종이 틀. 페이지 수만큼 종이를 본문 뒤에 깔고, 위·아래 여백에 머리말·바닥글({page}·{total}을 채운다)을 둔다.
 * 본문은 첫 페이지의 여백 안에서 시작하고, 페이지 나누기 확장(Pagination)이 페이지 끝을 넘는 블록을 다음 종이의 여백 안으로 민다.
 * 좁은 칸에서는 zoom으로 종이를 줄인다(나눔은 배율과 관계없다). 종이 크기는 rem이라 큰 화면이 기준 글자를 키우면 글과 함께 커진다.
 * onEditArea가 있으면 머리말·바닥글 자리를 두 번 눌러 고칠 수 있다(편집기가 설정 칸을 연다). PDF는 인쇄 화면이 같은 설정의 @page 규칙으로 만든다.
 */
export function PageCanvas({ setup, layout, zoom = 1, look, onEditArea, activeArea, numbering, children }: {
  setup: PageSetup; layout: PageLayout | null; zoom?: number; look?: PageLook; onEditArea?: (area: PageArea) => void;
  /** 앞에 다른 쪽이 있으면(PDF의 표지·목차·앞 문서) 쪽 번호를 이어 매긴다. */
  numbering?: PageNumbering;
  /** 지금 설정 칸에서 고치는 영역: 경계 점선과 표시를 늘 보인다. */
  activeArea?: PageArea | null; children: ReactNode;
}) {
  const format = formatOf(setup);
  const count = layout?.count ?? 1, stride = format.height + format.gap;
  const rem = (px: number) => `${px / 16}rem`;
  const style = {
    zoom, '--pg-width': rem(format.width), '--pg-height': rem(format.height), '--pg-total': rem(count * stride - format.gap),
    '--pg-margin-top': rem(format.marginTop), '--pg-margin-bottom': rem(format.marginBottom),
    '--pg-margin-left': rem(format.marginLeft), '--pg-margin-right': rem(format.marginRight),
    '--pg-gap': rem(format.gap), '--pg-header-distance': rem(setup.headerDistance * MM), '--pg-footer-distance': rem(setup.footerDistance * MM),
  } as CSSProperties;
  // 머리말·바닥글 영역: 종이 위·아래 여백 전체. 고칠 수 있으면 올렸을 때 본문과의 경계를 점선으로, 끝에 연필 단추를 보인다(두 번 눌러도 연다).
  const area = (kind: PageArea, number: number, parts: string[]) => {
    const isEmpty = !parts.some(Boolean);
    if (isEmpty && !onEditArea) return null;
    const name = kind === 'header' ? '머리말' : '바닥글';
    return <div data-empty={isEmpty || undefined} data-editable={onEditArea ? '' : undefined} data-active={activeArea === kind || undefined}
      aria-label={onEditArea ? name : undefined} aria-hidden={!onEditArea || undefined} onDoubleClick={onEditArea ? () => onEditArea(kind) : undefined}
      className={kind === 'header' ? `${AREA} top-0 h-(--pg-margin-top) items-start border-b pt-(--pg-header-distance)` : `${AREA} bottom-0 h-(--pg-margin-bottom) items-end border-t pb-(--pg-footer-distance)`}>
      {isEmpty ? <span className={REVEAL}>{`${name} 추가`}</span>
        : parts.map((part, index) => <span key={index} data-align={['start', 'center', 'end'][parts.length === 2 ? index * 2 : index]}
          className="min-w-0 flex-1 basis-0 truncate tabular-nums data-[align=center]:text-center data-[align=end]:text-end">
          {fillPageTokens(part, (numbering?.offset ?? 0) + number, numbering?.total ?? count)}
        </span>)}
      {onEditArea ? <Button variant="secondary" size="icon-sm" aria-label={`${name} 고치기`} title={`${name} 고치기`} onClick={() => onEditArea(kind)}
        className={`absolute right-3 z-2 rounded-full shadow-sm ${kind === 'header' ? 'bottom-1' : 'top-1'} ${REVEAL}`}><PenSquareIcon /></Button> : null}
    </div>;
  };
  const isTinted = (look?.style ?? 'tinted') === 'tinted';
  // check-ui: allow-style 종이 크기 · 여백 · 배율은 페이지 설정에서 계산한 값이다.
  return <div data-paged-canvas="" className={CANVAS} style={style} data-page-count={count} data-look={look?.style ?? 'tinted'} data-line={look?.line ?? 'solid'}>
    <div data-sheets="" className="pointer-events-none absolute inset-0 z-0 flex flex-col gap-(--pg-gap)">
      {Array.from({ length: count }, (_, index) => {
        const number = index + 1, isBare = setup.differentFirstPage && (numbering?.offset ?? 0) + number === 1;
        return <div key={index} data-sheet={number}
          className={`relative box-border h-(--pg-height) flex-none rounded-sm border border-transparent ${isTinted ? 'bg-[color-mix(in_oklab,var(--background),var(--foreground)_3%)]' : ''}`}>
          {isBare ? null : area('header', number, [setup.header.left, setup.header.right])}
          {isBare ? null : area('footer', number, [setup.footer.left, setup.footer.center, setup.footer.right])}
          {/* 구분선 모양: 페이지 사이 틈 가운데의 가로선(마지막 페이지 뒤에는 없다). */}
          {look?.style === 'divider' && number < count ? (look.line === 'wavy'
            // check-ui: allow-style 물결 무늬는 SVG 가리개 하나다.
            ? <div aria-hidden className="absolute inset-x-0 top-[calc(100%+var(--pg-gap)/2)] h-1.5 -translate-y-1/2 bg-input" style={{ mask: WAVE }} />
            : <div aria-hidden data-line={look.line}
              className="absolute inset-x-0 top-[calc(100%+var(--pg-gap)/2)] h-0 -translate-y-1/2 border-t border-input data-[line=dashed]:border-dashed data-[line=dotted]:border-t-2 data-[line=dotted]:border-dotted" />) : null}
        </div>;
      })}
    </div>
    {children}
  </div>;
}
