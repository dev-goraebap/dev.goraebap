"use client"

import * as React from "react"
import { cn } from "cn"

/**
 * 표 하나의 모양(2026-11-15, 표 공통). 페이지는 열 정의만 두고, 아래는 모두 키트가 정한다.
 * - 열 배치(layout): fit(기본)은 열들이 합쳐서 적정 너비(1920px, 좁은 화면은 화면 폭)까지 펼쳐 쓰고, 그보다 넓은 화면에서는
 *   줄 끝의 빈 채움 칸이 남는 폭을 가져 오른쪽이 빈다(줄 선 · 가리킴은 끝까지 이어진다). 내용이 1920px보다 길면 내용만큼 쓴다.
 *   fill은 열이 표 폭 전체를 나눠 갖는다(열 폭을 페이지가 정할 때).
 * - 머리: 44px, 흐린 글자, 위에 붙는다(sticky). 줄: 48px(촘촘하면 40px), 바탕을 칠해 점 무늬를 가리고 가리키면 옅게.
 * - 첫 칸 왼쪽 16px, 칸 사이 24px(좌우 12px씩). 긴 글은 TableText로 최대 폭에서 말줄임.
 */
/**
 * px로 적는다: 넓은 화면에서는 글자 기준 크기(rem)가 19px까지 커져(app/styles/index.css) 120rem이 2280px이 된다.
 */
/** fit 표의 적정 너비: 열들이 합쳐서 이만큼까지 펼쳐 쓴다(첫 칸 왼쪽 여백 1rem은 뺀다). 표가 놓인 상자가 좁으면 상자 폭까지. */
const FIT_WIDTH = "w-[calc(min(1920px,100cqw)-1rem)]"
type Layout = "fit" | "fill"
const TableLayoutContext = React.createContext<Layout>("fill")
const TableSectionContext = React.createContext<"head" | "body" | "foot">("body")

function Table({ className, layout = "fit", ...props }: React.ComponentProps<"table"> & { layout?: Layout }) {
  return (
    <TableLayoutContext.Provider value={layout}>
      <div
        data-slot="table-container"
        // @container: 적정 너비 재는 칸(TableHeader)이 이 상자의 폭(100cqw)을 넘지 않게 잰다.
        // 이 상자는 스크롤하지 않는다(2026-11-15): 스크롤 상자로 두면 세로로 줄어들어 표만 따로 스크롤하고 그 아래의 목록 끝 줄
        // (ListMore)이 화면 아래에 고정돼 보인다. 표는 페이지 본문과 함께 스크롤하고(머리는 본문 위에 붙는다), 좁은 화면에서
        // 넘치는 폭도 본문이 가로로 민다.
        className="@container relative w-full"
      >
        <table
          data-slot="table"
          data-layout={layout}
          className={cn("w-full caption-bottom text-sm [&_tr>*:first-child]:pl-4 [&_tr>*:last-child:not([data-filler])]:pr-4",
            className,
            // 내용 폭 열: 칸은 내용만큼에서 시작해(1px로 두면 내용 폭까지 자란다) 머리의 재는 칸이 적정 너비까지 벌리고, 남는 폭은
            // 채움 칸이 갖는다. 자동 배치여야 한다(table-fixed는 풀어 둔다).
            layout === "fit" && "table-auto [&_td:not([data-filler])]:w-px [&_th:not([data-filler])]:w-px")}
          {...props}
        />
      </div>
    </TableLayoutContext.Provider>
  )
}

function TableHeader({ className, children, ...props }: React.ComponentProps<"thead">) {
  const layout = React.useContext(TableLayoutContext)
  // 열 수: 첫 머리 줄의 칸 수(조건으로 빠진 칸은 세지 않는다).
  const first = React.Children.toArray(children)[0]
  const columns = React.isValidElement<{ children?: React.ReactNode }>(first) ? React.Children.toArray(first.props.children).length : 0
  return (
    <TableSectionContext.Provider value="head">
      <thead
        data-slot="table-header"
        // 머리는 위에 붙는다. 아래 선은 칸 안쪽 그림자로 긋는다: 붙여 두면 합쳐진 테두리(border-collapse)는 따라오지 않는다.
        className={cn("sticky top-0 z-10 bg-background [&_tr]:border-b-0 [&_tr]:bg-background [&_tr]:hover:bg-background [&_th]:shadow-[inset_0_-1px_0_var(--border)]", className)}
        {...props}
      >
        {/* 적정 너비 재는 줄(fit): 모든 열에 걸친 높이 0의 칸이 열들의 합을 1920px(상자가 좁으면 상자 폭)까지 벌린다. */}
        {layout === "fit" && columns > 0 ? (
          <tr aria-hidden data-slot="table-sizer">
            <th colSpan={columns} className="h-0 p-0"><div className={FIT_WIDTH} /></th>
            <th data-filler className="w-full p-0" />
          </tr>
        ) : null}
        {children}
      </thead>
    </TableSectionContext.Provider>
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <TableSectionContext.Provider value="body">
      <tbody
        data-slot="table-body"
        // 마지막 줄도 아래 선을 둔다(표 아래가 비어 보이지 않게). 줄 높이는 48px, 목록 높이가 촘촘하면 40px.
        className={cn("[&>tr]:h-12 compact:[&>tr]:h-10", className)}
        {...props}
      />
    </TableSectionContext.Provider>
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <TableSectionContext.Provider value="foot">
      <tfoot
        data-slot="table-footer"
        className={cn(
          "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
          className
        )}
        {...props}
      />
    </TableSectionContext.Provider>
  )
}

function TableRow({ className, children, ...props }: React.ComponentProps<"tr">) {
  const layout = React.useContext(TableLayoutContext)
  const section = React.useContext(TableSectionContext)
  return (
    <tr
      data-slot="table-row"
      className={cn(
        // 줄은 자기 바탕을 칠해 페이지의 점 무늬를 가리고, 가리키면 옅게 덮는다.
        "relative border-b bg-background transition-colors hover:bg-row-hover has-aria-expanded:bg-row-hover data-[state=selected]:bg-muted",
        className
      )}
      {...props}
    >
      {children}
      {/* 내용 폭 열(fit): 줄 끝의 빈 채움 칸이 남는 폭을 갖는다. */}
      {layout === "fit" ? (section === "head" ? <th data-filler aria-hidden className="w-full p-0" /> : <td data-filler aria-hidden className="w-full p-0" />) : null}
    </tr>
  )
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-11 px-3 text-left align-middle font-medium whitespace-nowrap text-muted-foreground [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "px-3 py-2 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
}

/** 칸 안의 긴 글(설명 · 이메일 · 한 일): 최대 폭에서 말줄임한다. 표 칸은 최대 폭을 지키지 않아 안쪽 글에 둔다. */
function TableText({ className, size = "md", ...props }: React.ComponentProps<"span"> & { size?: "sm" | "md" | "lg" }) {
  return <span data-slot="table-text" className={cn("block truncate", { sm: "max-w-48", md: "max-w-72", lg: "max-w-96" }[size], className)} {...props} />
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableText,
  TableCaption,
}
