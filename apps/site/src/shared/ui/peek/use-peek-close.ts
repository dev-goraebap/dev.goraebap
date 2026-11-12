import { useEffect, useRef } from "react"

/** 줄이 담은 링크(없으면 줄 자체). 미리보기를 닫은 뒤 초점이 돌아갈 곳이다. */
export const rowFocusTarget = (row: HTMLElement | null | undefined) =>
  row?.matches("a[href]") ? row : row?.querySelector<HTMLElement>("a[href]") ?? row ?? undefined

/** 입력 중이거나 뜬 창(대화상자 · 바텀시트 · 메뉴) 안의 Esc는 그것이 받는다. */
const OWNS_ESCAPE = "input, textarea, select, [contenteditable='true'], [role=dialog], [role=alertdialog], [role=menu], [role=listbox]"

/**
 * 미리보기 칸의 닫기 약속: 열려 있는 동안 Esc로 닫고, 닫히면(또는 다른 항목으로 바뀌면) 초점을 그 줄(data-peek-row)로 돌린다.
 * 줄이 남아 있고 초점이 갈 곳을 잃었을 때만 돌린다(닫기 단추가 사라져 body로 떨어진 경우).
 */
export function usePeekClose(id: string | undefined, onClose: () => void) {
  const latest = useRef(onClose)
  latest.current = onClose
  useEffect(() => {
    if (!id) return undefined
    const keydown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return
      if ((event.target as HTMLElement | null)?.closest(OWNS_ESCAPE)) return
      latest.current()
    }
    window.addEventListener("keydown", keydown)
    return () => {
      window.removeEventListener("keydown", keydown)
      requestAnimationFrame(() => {
        if (document.activeElement && document.activeElement !== document.body) return
        rowFocusTarget(document.querySelector<HTMLElement>(`[data-peek-row="${CSS.escape(id)}"]`))?.focus()
      })
    }
  }, [id])
}
