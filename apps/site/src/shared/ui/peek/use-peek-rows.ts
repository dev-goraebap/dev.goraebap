import type { KeyboardEvent, MouseEvent } from "react"
import { useIsMobile } from "@/shared/lib/use-mobile"
import type { Peek } from "@/shared/lib/use-peek"
import { rowFocusTarget } from "./use-peek-close"

const rowOf = (target: EventTarget) => (target as HTMLElement).closest<HTMLElement>("[data-peek-row]")

/**
 * 미리보기를 여는 목록의 줄 다루기. 목록을 감싼 요소에 돌려준 props를 펼치고, 줄마다 data-peek-row={id}와 링크 하나를 둔다.
 * - openOnClick(처리 목록): 줄을 그냥 누르면 옆 칸에 연다(처음은 기록을 쌓고 옮길 때는 바꾼다). 보조 키 · 가운데 단추는 링크대로 새 탭.
 * - 아니면(작업 목록): 줄 누르기는 링크대로 페이지로 가고, 줄 링크에 초점을 두고 Space로 미리보기를 열고 닫는다.
 * - ↑ ↓: 이웃 줄로 초점을 옮기고, 미리보기가 열려 있으면 그 줄로 바꾼다.
 * 휴대폰은 옆 칸이 없어 링크(그 페이지)를 그대로 따른다.
 */
export function usePeekRows(peek: Peek, { openOnClick = false }: { openOnClick?: boolean } = {}) {
  const isMobile = useIsMobile()
  const onClickCapture = (event: MouseEvent<HTMLElement>) => {
    if (!openOnClick || isMobile || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    const row = rowOf(event.target)
    // 줄 안의 다른 단추(별표 · … 메뉴)는 자기 일을 한다.
    if (!row || (event.target as HTMLElement).closest("button, [role=button]")) return
    event.preventDefault()
    const id = row.dataset.peekRow!
    if (peek.id !== id) peek.open(id)
  }
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    const row = rowOf(event.target)
    if (!row || isMobile) return
    const id = row.dataset.peekRow!
    if (event.key === " " && !openOnClick && event.target instanceof HTMLAnchorElement) {
      event.preventDefault()
      if (peek.id === id) peek.close()
      else peek.open(id)
      return
    }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return
    const rows = [...(event.currentTarget.querySelectorAll<HTMLElement>("[data-peek-row]"))]
    const next = rows[rows.indexOf(row) + (event.key === "ArrowDown" ? 1 : -1)]
    if (!next) return
    event.preventDefault()
    rowFocusTarget(next)?.focus()
    if (peek.id) peek.move(next.dataset.peekRow!)
  }
  return { onClickCapture, onKeyDown }
}
