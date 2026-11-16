import {
  useEffect, useEffectEvent, useId, useLayoutEffect, useRef, useState,
  type KeyboardEvent as ReactKeyboardEvent, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent,
} from "react"
import { flushSync } from "react-dom"
import { placeAt, placeFor, stepBy } from "./order"

/** 누른 뒤 이만큼(px) 움직여야 집는다. 그 전에 떼면 그냥 누름이다. */
const THRESHOLD = 4
/** 스크롤하는 상자의 위 · 아래 이 폭(px) 안에 들면 그쪽으로 스크롤한다. 깊이 들수록 빠르게(최대 SPEED px/프레임). */
const EDGE = 56
const SPEED = 16
const SLIDE_MS = 200
const SETTLE_MS = 220
const EASE = "cubic-bezier(0.2, 0, 0, 1)"

/**
 * 집어 든 줄의 복사본(따라다니는 그림). 놓인 자리에서 시작해 들어 올리며(data-lifted) 기울고, 놓으면(data-settling) 자리로 내려앉는다.
 * 줄 안의 손잡이도 진하게 보인다. 움직임을 줄이는 설정에서는 기울지 않고 바로 놓인다.
 */
export const REORDER_GHOST = [
  // 줄 자신의 배치 클래스(relative · 여백)를 이겨야 손을 따라 화면 위에 뜬다.
  "fixed! top-0! left-0! z-50 m-0! box-border pointer-events-none rounded-lg border bg-popover shadow-sm",
  "transition-[rotate,scale,box-shadow] duration-160 ease-[cubic-bezier(0.2,0,0,1)]",
  "data-lifted:rotate-[2.5deg] data-lifted:scale-[1.025] data-lifted:shadow-lg",
  "data-settling:transition-[transform,rotate,scale,box-shadow] data-settling:duration-220",
  "motion-reduce:rotate-0! motion-reduce:scale-100! motion-reduce:transition-none! motion-reduce:shadow-lg",
  "**:data-grip:text-foreground",
].join(" ")

/** 줄의 이름(알림 문장에 넣는다). */
type Row = { id: string; name: string }
/**
 * 알림 문장의 낱말: word "결재자", object "결재자를", topic "결재자는". 한국어 조사가 받침에 따라 바뀌어 부르는 쪽이 정한다.
 */
export type RowNoun = { word: string; object: string; topic: string }
type Carry = { id: string; isSettling: boolean }
type Press = { id: string; pointerId: number; isTouch: boolean; x: number; y: number }
type Ghost = { element: HTMLElement; dx: number; dy: number; height: number }

const isReduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches
const speed = (depth: number) => Math.ceil((Math.min(depth, EDGE) / EDGE) * SPEED)

function scrollParent(element: HTMLElement): HTMLElement {
  for (let parent = element.parentElement; parent; parent = parent.parentElement) {
    const { overflowY } = getComputedStyle(parent)
    if ((overflowY === "auto" || overflowY === "scroll") && parent.scrollHeight > parent.clientHeight) return parent
  }
  return document.scrollingElement as HTMLElement
}

/** 집어 든 동안 화면 어디서든 쥔 손 모양이고 글이 골라지지 않는다. CSS 파일 없이 이 동안만 규칙 하나를 둔다. */
function grabbing(isOn: boolean) {
  const id = "row-reorder-grabbing"
  const existing = document.getElementById(id)
  if (!isOn) { existing?.remove(); return }
  if (existing) return
  const style = document.createElement("style")
  style.id = id
  style.textContent = "html, html * { cursor: grabbing !important; user-select: none !important; }"
  document.head.append(style)
}

export type RowReorderOptions = {
  /** 저장된 순서의 줄. 저장이 끝나 새 순서가 오면 그것을 따른다. */
  rows: readonly Row[]
  noun: RowNoun
  /** 새 순서를 저장한다. 실패하면 throw: 저장된 순서로 되돌리고 onError를 부른다. */
  onReorder: (order: string[]) => Promise<void>
  onError?: (failure: unknown) => void
}

/**
 * 줄 순서 바꾸기(손잡이를 끌거나 손잡이에 초점을 두고 Alt + ↑/↓). 목록에 list · rowProps, 손잡이에 gripProps를 펼치고
 * 보여 줄 순서는 order를 따른다. hint(설명)와 said(바뀐 일의 알림)는 ReorderAnnouncer가 화면 낭독기에 읽힌다.
 * - 끄는 동안 줄은 제자리를 점선 틀로 비우고 복사본이 손을 따라온다. 이웃 줄은 비켜 미끄러지고, 상자 끝에 닿으면 스크롤한다.
 * - Esc · 손가락 취소는 처음 순서로 되돌린다. 놓으면 바로 새 순서를 보이고 저장하며, 저장 중에 또 옮기면 마지막 것만 보낸다.
 * 목록 요소의 종류는 E로 정한다(useRowReorder<HTMLUListElement>).
 * - 줄이 자기 목록(하위 부서)을 품어도 목록의 바로 아래 줄만 센다. 대화상자 안이면 복사본도 대화상자 안에 그린다.
 */
export function useRowReorder<E extends HTMLElement = HTMLDivElement>({ rows, noun, onReorder, onError }: RowReorderOptions) {
  const list = useRef<E>(null)
  const hint = useId()
  // 끄는 동안과 저장된 순서가 돌아오기 전까지 보이는, 방금 만든 순서.
  const [moved, setMoved] = useState<string[] | null>(null)
  const [carry, setCarry] = useState<Carry | null>(null)
  const [said, setSaid] = useState("")
  const saved = rows.map(row => row.id)
  const order = moved ? [...moved.filter(id => saved.includes(id)), ...saved.filter(id => !moved.includes(id))] : saved
  const live = useRef(order)
  live.current = order
  const carried = useRef<Carry | null>(null)
  const press = useRef<Press | null>(null)
  const ghost = useRef<Ghost | null>(null)
  const start = useRef<string[]>([])
  const pointer = useRef({ x: 0, y: 0 })
  const wanted = useRef<string[] | null>(null)
  const isSending = useRef(false)
  const keepsFocus = useRef<string | null>(null)
  const tops = useRef(new Map<string, number>())
  const slides = useRef(new WeakMap<Element, Animation>())
  const sendLatest = useRef(onReorder)
  const onErrorLatest = useRef(onError)
  useLayoutEffect(() => { sendLatest.current = onReorder; onErrorLatest.current = onError })

  const nameOf = (id: string) => rows.find(row => row.id === id)?.name ?? ""
  const put = (next: Carry | null) => { carried.current = next; setCarry(next) }
  const show = (next: string[]) => { live.current = next; setMoved(next) }
  const rowsIn = () => [...(list.current?.querySelectorAll<HTMLElement>(":scope > [data-row]") ?? [])]
  // 표 줄과 하위 목록의 줄은 목록과 offsetParent가 달라 화면 좌표로 잰다. 미끄러지는 중의 이동은 빼고 잰다.
  const topOf = (element: HTMLElement) => {
    const transform = getComputedStyle(element).transform
    const shift = transform === "none" ? 0 : new DOMMatrixReadOnly(transform).m42
    return element.getBoundingClientRect().top - shift - (list.current?.getBoundingClientRect().top ?? 0)
  }

  const commit = async (next: string[]) => {
    show(next)
    wanted.current = next
    if (isSending.current) return
    isSending.current = true
    while (wanted.current) {
      const sending = wanted.current
      wanted.current = null
      try {
        await sendLatest.current(sending)
      } catch (failure) {
        wanted.current = null
        onErrorLatest.current?.(failure)
        setSaid("순서를 저장하지 못해 되돌렸습니다.")
      }
    }
    isSending.current = false
    if (!carried.current) setMoved(null)
  }

  const settle = (id: string) => {
    const at = ghost.current
    const slot = list.current?.querySelector<HTMLElement>(`:scope > [data-row="${CSS.escape(id)}"]`)
    const finish = () => { at?.element.remove(); if (ghost.current === at) ghost.current = null; put(null) }
    if (!at || !slot || !list.current || isReduced()) { finish(); return }
    put({ id, isSettling: true })
    at.element.dataset.settling = ""
    delete at.element.dataset.lifted
    const rect = slot.getBoundingClientRect()
    at.element.style.transform = `translate(${rect.left}px, ${rect.top}px)`
    let isDone = false
    const done = () => { if (!isDone) { isDone = true; finish() } }
    at.element.addEventListener("transitionend", event => { if (event.propertyName === "transform") done() })
    setTimeout(done, SETTLE_MS + 80)
  }

  const release = () => { press.current = null }
  const drop = () => {
    const now = carried.current
    release()
    grabbing(false)
    if (!now || now.isSettling) return
    const next = live.current
    flushSync(() => setMoved(next))
    settle(now.id)
    if (next.join() !== start.current.join()) {
      setSaid(`'${nameOf(now.id)}' ${noun.object} ${next.indexOf(now.id) + 1}번째에 놓았습니다.`)
      void commit(next)
    } else {
      setSaid(`'${nameOf(now.id)}' ${noun.object} 제자리에 두었습니다.`)
      if (!isSending.current) setMoved(null)
    }
  }
  const cancel = () => {
    const now = carried.current
    release()
    grabbing(false)
    if (!now || now.isSettling) return
    flushSync(() => show(start.current))
    settle(now.id)
    setSaid("옮기기를 취소했습니다.")
  }

  const follow = (x: number, y: number) => {
    pointer.current = { x, y }
    const at = ghost.current
    const now = carried.current
    if (!at || !now || now.isSettling || !list.current) return
    at.element.style.transform = `translate(${x - at.dx}px, ${y - at.dy}px)`
    const elements = rowsIn()
    const from = elements.findIndex(element => element.dataset.row === now.id)
    if (from < 0) return
    const middle = y - at.dy + at.height / 2 - list.current.getBoundingClientRect().top
    const index = placeFor(elements.map(element => ({ top: topOf(element), height: element.offsetHeight })), from, middle)
    const next = placeAt(live.current, now.id, index)
    if (next.join() !== live.current.join()) show(next)
  }

  const lift = (at: Press) => {
    const row = list.current?.querySelector<HTMLElement>(`:scope > [data-row="${CSS.escape(at.id)}"]`)
    if (!row) return
    const rect = row.getBoundingClientRect()
    const copy = row.cloneNode(true) as HTMLElement
    copy.removeAttribute("data-row")
    copy.removeAttribute("data-carried")
    copy.setAttribute("aria-hidden", "true")
    copy.inert = true
    copy.classList.add(...REORDER_GHOST.split(/\s+/).filter(Boolean))
    copy.style.inlineSize = `${rect.width}px`
    copy.style.transformOrigin = `${at.x - rect.left}px ${at.y - rect.top}px`
    copy.style.transform = `translate(${rect.left}px, ${rect.top}px)`
    // 열린 대화상자 안이면 복사본도 그 안에 둔다(대화상자 위층에 가려지지 않게).
    ;(row.closest<HTMLElement>("[role=dialog], dialog[open]") ?? document.body).append(copy)
    // 들어 올리기는 놓인 자리에서 시작하는 전환이다: 먼저 그대로 보인 뒤 올리고 기울인다.
    requestAnimationFrame(() => requestAnimationFrame(() => { if (ghost.current?.element === copy && !copy.dataset.settling) copy.dataset.lifted = "" }))
    ghost.current = { element: copy, dx: at.x - rect.left, dy: at.y - rect.top, height: rect.height }
    start.current = live.current
    if (at.isTouch) navigator.vibrate?.(8)
    grabbing(true)
    show(live.current)
    put({ id: at.id, isSettling: false })
    setSaid(`'${nameOf(at.id)}' ${noun.object} 집었습니다. ${live.current.indexOf(at.id) + 1}번째.`)
  }

  const onPointerMove = useEffectEvent((event: PointerEvent) => {
    const at = press.current
    if (!at || event.pointerId !== at.pointerId) return
    if (carried.current) { follow(event.clientX, event.clientY); return }
    if (Math.hypot(event.clientX - at.x, event.clientY - at.y) >= THRESHOLD) { lift(at); follow(event.clientX, event.clientY) }
  })
  const onPointerUp = useEffectEvent((event: PointerEvent) => {
    if (press.current?.pointerId !== event.pointerId) return
    if (carried.current) drop()
    else release()
  })
  const onPointerCancel = useEffectEvent((event: PointerEvent) => {
    if (press.current?.pointerId !== event.pointerId) return
    if (carried.current) cancel()
    else release()
  })
  const onEscape = useEffectEvent((event: KeyboardEvent) => {
    if (event.key !== "Escape" || !press.current || !carried.current) return
    event.preventDefault()
    event.stopPropagation()
    cancel()
  })
  const onScrolled = useEffectEvent(() => follow(pointer.current.x, pointer.current.y))

  useEffect(() => {
    window.addEventListener("pointermove", onPointerMove)
    window.addEventListener("pointerup", onPointerUp)
    window.addEventListener("pointercancel", onPointerCancel)
    window.addEventListener("keydown", onEscape, true)
    return () => {
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerup", onPointerUp)
      window.removeEventListener("pointercancel", onPointerCancel)
      window.removeEventListener("keydown", onEscape, true)
      ghost.current?.element.remove()
      grabbing(false)
    }
  }, [])

  // 끄는 동안 줄이 든 스크롤 상자는 위 · 아래 끝에서 스크롤한다.
  const isDragging = Boolean(carry && !carry.isSettling)
  useEffect(() => {
    const box = list.current
    if (!isDragging || !box) return undefined
    const page = scrollParent(box)
    let frame = 0
    const tick = () => {
      const { y } = pointer.current
      const area = page === document.scrollingElement ? { top: 0, bottom: window.innerHeight } : page.getBoundingClientRect()
      const dy = y < area.top + EDGE ? -speed(area.top + EDGE - y) : y > area.bottom - EDGE ? speed(y - area.bottom + EDGE) : 0
      if (dy) {
        const before = page.scrollTop
        page.scrollTop += dy
        if (page.scrollTop !== before) onScrolled()
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [isDragging])

  // 자리가 바뀐 줄은 있던 곳에서 미끄러져 온다(미끄러지는 중이면 보이던 곳에서). 키로 옮긴 손잡이는 초점을 지킨다.
  useLayoutEffect(() => {
    const isStill = isReduced()
    const next = new Map<string, number>()
    for (const element of rowsIn()) {
      const id = element.dataset.row!
      const top = topOf(element)
      next.set(id, top)
      const before = tops.current.get(id)
      if (before === undefined || before === top || isStill) continue
      const running = slides.current.get(element)
      const shift = running ? new DOMMatrixReadOnly(getComputedStyle(element).transform).m42 : 0
      running?.cancel()
      slides.current.set(element, element.animate([{ transform: `translateY(${before + shift - top}px)` }, { transform: "none" }], { duration: SLIDE_MS, easing: EASE }))
    }
    tops.current = next
    const id = keepsFocus.current
    if (id) {
      keepsFocus.current = null
      const grip = list.current?.querySelector<HTMLElement>(`:scope > [data-row="${CSS.escape(id)}"] [data-grip]`)
      if (grip && document.activeElement !== grip) grip.focus({ preventScroll: true })
      grip?.scrollIntoView({ block: "nearest" })
    }
  })

  const onPointerDown = (event: ReactPointerEvent<HTMLElement>, id: string) => {
    if (event.button !== 0 || carried.current || press.current) return
    // 마우스로 손잡이를 눌러도 글이 골라지지 않게 한다. 손가락은 손잡이만 받는다(touch-action: none).
    if (event.pointerType === "mouse") event.preventDefault()
    press.current = { id, pointerId: event.pointerId, isTouch: event.pointerType === "touch", x: event.clientX, y: event.clientY }
  }

  const onKeyDown = (event: ReactKeyboardEvent, id: string) => {
    if (!event.altKey || (event.key !== "ArrowUp" && event.key !== "ArrowDown")) return
    event.preventDefault()
    if (carried.current) return
    const next = stepBy(live.current, id, event.key === "ArrowUp" ? -1 : 1)
    const name = nameOf(id)
    if (next.join() === live.current.join()) {
      setSaid(`'${name}' ${noun.topic} 이미 ${event.key === "ArrowUp" ? "맨 위" : "맨 아래"}입니다.`)
      return
    }
    keepsFocus.current = id
    setSaid(`'${name}' ${noun.object} ${next.indexOf(id) + 1}번째로 옮겼습니다.`)
    void commit(next)
  }

  // 손잡이에 손가락을 오래 대면 브라우저 메뉴가 뜬다. 손잡이는 그 누름을 옮기기에 쓴다.
  const onContextMenu = (event: ReactMouseEvent) => { if (press.current?.isTouch || carried.current) event.preventDefault() }

  return {
    /** 줄들을 바로 담은 요소(ul · tbody · div)에 단다. */
    list,
    hint,
    said,
    /** 보일 순서(id). */
    order,
    isCarrying: isDragging,
    rowProps: (id: string) => ({ "data-row": id, "data-carried": carry?.id === id || undefined }),
    gripProps: (row: Row) => ({
      "data-grip": true,
      "aria-label": `${row.name} ${noun.word} 순서 바꾸기`,
      "aria-describedby": hint,
      title: "끌거나 Alt + ↑/↓로 순서를 바꿉니다",
      onPointerDown: (event: ReactPointerEvent<HTMLElement>) => onPointerDown(event, row.id),
      onKeyDown: (event: ReactKeyboardEvent) => onKeyDown(event, row.id),
      onContextMenu,
    }),
  }
}

export type RowReorder = ReturnType<typeof useRowReorder<HTMLElement>>
