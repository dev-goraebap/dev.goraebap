import type { CSSProperties, ReactNode } from "react"
import { Button } from "@/shared/ui/button"
import { PencilIcon } from "@/shared/ui/icon"
import { MM, fillPageTokens, formatOf, printPageRule, type PageLook, type PageSetup } from "./model"
import type { PageLayout } from "./pagination"

export type PageArea = "header" | "footer"

/** 물결 구분선의 무늬(16 × 6 SVG). 선 색은 바탕(bg-input)이고 무늬는 가리개(mask)라 테마 색을 따른다. */
const WAVE = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='6' viewBox='0 0 16 6'%3E%3Cpath d='M0 3 Q4 0 8 3 T16 3' fill='none' stroke='black' stroke-width='1.25'/%3E%3C/svg%3E\") repeat-x 0 0 / 16px 6px"

/**
 * 종이의 글자 크기는 앱 화면 크기와 관계없이 데스크톱 값으로 고정한다: 인쇄할 때는 종이 폭(약 640px)이 화면 폭이 되어 휴대폰 글자
 * 규칙(width < 64rem)이 켜지는데, 그러면 글이 커져 화면과 다른 자리에서 페이지가 나뉜다.
 * 페이지 나눔 간격(.pg-gap)은 화면에만 있다: 블록 앞 간격은 높이 없이 margin만, 문단 안 간격은 줄 하나 크기의 빈 상자, 표 안 간격은
 * 테두리 없는 빈 행이다. 인쇄에서는 간격을 빼고 넘긴 블록 앞에서 페이지를 넘긴다(.pg-start). 문단 안의 나눔은 인쇄가 줄 단위로 알아서
 * 한다(인쇄의 글자 폭이 화면과 조금 달라 화면의 줄 자리에 빈 줄을 두면 빈 공간이 생긴다). 긴 표는 행 사이에서 넘긴다.
 */
const CANVAS = [
  "group/canvas relative box-border w-(--pg-width) min-h-(--pg-total) flex-none pt-(--pg-margin-top) pr-(--pg-margin-right) pb-(--pg-margin-bottom) pl-(--pg-margin-left)",
  "[page:document-page] [--text-base:0.9375rem] [--text-sm:0.8125rem] [--text-xs:0.75rem] [&>:not([data-sheets])]:relative [&>:not([data-sheets])]:z-1",
  "[&_.pg-gap]:block [&_.pg-gap]:h-0 [&_.pg-gap]:border-0 [&_.pg-gap]:p-0 [&_span.pg-line-gap]:block [&_tr.pg-row-gap]:table-row [&_tr.pg-row-gap]:h-auto",
  "[&_tr.pg-row-gap>td]:border-0 [&_tr.pg-row-gap>td]:bg-transparent [&_tr.pg-row-gap>td]:p-0 [&_.pg-measuring_.pg-gap]:hidden",
  "print:min-h-0 print:w-auto print:p-0 print:[zoom:1]! print:[&_.pg-gap]:hidden print:[&_tr.pg-row-gap]:hidden print:[&_span.pg-line-gap]:hidden",
  "print:[&_p]:[orphans:2] print:[&_p]:[widows:2] print:[&_.pg-start]:break-before-page print:[&_.ProseMirror_table]:break-inside-auto",
].join(" ")

/**
 * 머리말 · 바닥글: 종이 위 · 아래 여백 전체가 영역이고 글은 가장자리에서 정한 거리에 놓인다. 고칠 수 있으면 올렸을 때(또는 고치는 중일 때)
 * 본문과의 경계에 점선, 영역에 옅은 바탕, 경계 위 오른쪽에 연필 단추가 보인다. 빈 영역은 올렸을 때만 "머리말 추가"가 보인다.
 */
const AREA = "group/area pointer-events-auto absolute inset-x-0 box-border flex justify-between gap-3 border-dashed border-transparent pr-(--pg-margin-right) pl-(--pg-margin-left) "
  + "text-xs text-muted-foreground data-editable:cursor-text data-editable:hover:border-input data-editable:hover:bg-[color-mix(in_oklab,transparent,var(--foreground)_3%)] "
  + "data-editable:data-active:border-input data-editable:data-active:bg-[color-mix(in_oklab,transparent,var(--foreground)_3%)]"
const REVEAL = "opacity-0 group-focus-within/area:opacity-100 group-hover/area:opacity-100 group-data-active/area:opacity-100"

/**
 * 페이지 보기의 종이 틀. 페이지 수만큼 종이를 본문 뒤에 깔고, 위 · 아래 여백에 머리말 · 바닥글({page} · {total}을 채운다)을 둔다.
 * 본문은 첫 페이지의 여백 안에서 시작하고, 페이지 나누기 확장(Pagination)이 페이지 끝을 넘는 블록을 다음 종이의 여백 안으로 민다.
 * 좁은 칸에서는 zoom으로 종이를 줄인다(나눔은 배율과 관계없다). 종이 크기는 rem이라 큰 화면이 기준 글자를 키우면 글과 함께 커진다.
 * onEditArea가 있으면 머리말 · 바닥글 자리를 두 번 눌러 고칠 수 있다(편집기가 설정 칸을 연다). 인쇄는 같은 설정의 @page 규칙을 쓴다.
 * 종이 모양(look): 연한 바탕은 바깥만 아주 옅게 다른 색에 페이지 테두리가 거의 보이지 않고, 구분선은 같은 바탕에 페이지 사이에만 선을 둔다.
 */
export function PageCanvas({ setup, layout, zoom = 1, look, onEditArea, activeArea, isInline = false, children }: {
  setup: PageSetup; layout: PageLayout | null; zoom?: number; look?: PageLook; onEditArea?: (area: PageArea) => void
  /** 지금 설정 칸에서 고치는 영역: 경계 점선과 표시를 늘 보인다. */
  activeArea?: PageArea | null
  /** 상세 본문 안: 판(바깥 바탕) 없이 연한 바탕은 종이 자체를 옅게 칠하고 페이지 사이 틈으로 가른다. */
  isInline?: boolean
  children: ReactNode
}) {
  const format = formatOf(setup)
  const count = layout?.count ?? 1, stride = format.height + format.gap
  const rem = (px: number) => `${px / 16}rem`
  const vars = {
    zoom, "--pg-width": rem(format.width), "--pg-height": rem(format.height), "--pg-total": rem(count * stride - format.gap),
    "--pg-margin-top": rem(format.marginTop), "--pg-margin-bottom": rem(format.marginBottom),
    "--pg-margin-left": rem(format.marginLeft), "--pg-margin-right": rem(format.marginRight),
    "--pg-gap": rem(format.gap), "--pg-header-distance": rem(setup.headerDistance * MM), "--pg-footer-distance": rem(setup.footerDistance * MM),
  } as CSSProperties
  const isTinted = (look?.style ?? "tinted") === "tinted"
  const area = (kind: PageArea, number: number, parts: string[]) => {
    const isEmpty = !parts.some(Boolean)
    if (isEmpty && !onEditArea) return null
    const name = kind === "header" ? "머리말" : "바닥글"
    return (
      <div data-empty={isEmpty || undefined} data-editable={onEditArea ? "" : undefined} data-active={activeArea === kind || undefined}
        aria-label={onEditArea ? name : undefined} aria-hidden={!onEditArea || undefined} onDoubleClick={onEditArea ? () => onEditArea(kind) : undefined}
        className={kind === "header" ? `${AREA} top-0 h-(--pg-margin-top) items-start border-b pt-(--pg-header-distance)` : `${AREA} bottom-0 h-(--pg-margin-bottom) items-end border-t pb-(--pg-footer-distance)`}>
        {isEmpty ? <span className={REVEAL}>{`${name} 추가`}</span>
          : parts.map((part, index) => (
            <span key={index} data-align={["start", "center", "end"][parts.length === 2 ? index * 2 : index]}
              className="min-w-0 flex-1 basis-0 truncate tabular-nums data-[align=center]:text-center data-[align=end]:text-end">
              {fillPageTokens(part, number, count)}
            </span>
          ))}
        {onEditArea ? (
          <Button variant="secondary" size="icon-sm" aria-label={`${name} 고치기`} title={`${name} 고치기`} onClick={() => onEditArea(kind)}
            className={`absolute right-3 z-2 rounded-full shadow-sm ${kind === "header" ? "bottom-1" : "top-1"} ${REVEAL}`}>
            <PencilIcon />
          </Button>
        ) : null}
      </div>
    )
  }
  return (
    // check-ui: allow-style 종이 크기 · 여백 · 배율은 페이지 설정에서 계산한 값이다.
    <div className={CANVAS} style={vars} data-page-count={count} data-look={look?.style ?? "tinted"} data-line={look?.line ?? "solid"}>
      <style>{printPageRule(setup)}</style>
      <div data-sheets="" className="pointer-events-none absolute inset-0 z-0 print:hidden">
        {Array.from({ length: count }, (_, index) => {
          const number = index + 1, isBare = setup.differentFirstPage && number === 1
          return (
            <div key={index} data-sheet={number}
              className={isTinted && isInline ? "absolute inset-x-0 box-border h-(--pg-height) rounded-sm border border-transparent bg-[color-mix(in_oklab,var(--card),var(--foreground)_3%)]"
                : isTinted ? "absolute inset-x-0 box-border h-(--pg-height) rounded-sm border border-[color-mix(in_oklab,var(--card),var(--foreground)_6%)] bg-card"
                  : "absolute inset-x-0 box-border h-(--pg-height) rounded-sm border border-transparent bg-card"}
              // check-ui: allow-style 종이마다 다른 세로 자리다.
              style={{ insetBlockStart: rem(index * stride) }}>
              {isBare ? null : area("header", number, [setup.header.left, setup.header.right])}
              {isBare ? null : area("footer", number, [setup.footer.left, setup.footer.center, setup.footer.right])}
              {/* 구분선 모양: 페이지 사이 틈 가운데의 가로선(마지막 페이지 뒤에는 없다). */}
              {look?.style === "divider" && number < count ? (
                look.line === "wavy"
                  // check-ui: allow-style 물결 무늬는 SVG 가리개 하나다.
                  ? <div aria-hidden className="absolute inset-x-0 top-[calc(100%+var(--pg-gap)/2)] h-1.5 -translate-y-1/2 bg-input" style={{ mask: WAVE }} />
                  : <div aria-hidden data-line={look.line}
                    className="absolute inset-x-0 top-[calc(100%+var(--pg-gap)/2)] h-0 -translate-y-1/2 border-t border-input data-[line=dashed]:border-dashed data-[line=dotted]:border-t-2 data-[line=dotted]:border-dotted" />
              ) : null}
            </div>
          )
        })}
      </div>
      {children}
    </div>
  )
}
