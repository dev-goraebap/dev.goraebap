import * as React from "react"
import { flushSync } from "react-dom"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { cn } from "cn"

import { Button, ButtonStyleReset } from "@/shared/ui/kit/button"
import { SquareArrowOutUpRightIcon, XIcon } from "@/shared/ui/kit/icon"

type Size = { width: number; height: number }

/**
 * 목록 위 대화상자(Routed Modal)의 자리. 앱이 라우트 마스킹으로 띄우는 대화상자만 이 안에 있다(DialogPanel로 감싼다).
 * - isSwapped: 앞 대화상자(불러오는 중 · 바꿔 연 것)를 바꿔 낀 것. 자기 여는 움직임(확대 · 바탕 흐림)을 하지 않는다. 바꾸는 움직임은
 *   브라우저의 화면 전환(swapDialog)이 맡는다.
 * 안에서 또 띄운 대화상자(양식 · 확인)는 이 자리가 아니다(DialogContent가 끊는다).
 */
type DialogPanelState = { isSwapped: boolean }
const DialogPanelContext = React.createContext<DialogPanelState | null>(null)

function DialogPanel({ isSwapped, children }: { isSwapped: boolean; children: React.ReactNode }) {
  const value = React.useMemo(() => ({ isSwapped }), [isSwapped])
  return <DialogPanelContext.Provider value={value}>{children}</DialogPanelContext.Provider>
}

/**
 * 목록 위 대화상자를 다른 것으로 바꾼다(불러오는 중 → 내용, 대화상자 → 대화상자): View Transitions API로 앞 화면이 흐려지는 동안
 * 새 화면이 진해지며 겹치고, 틀의 크기는 브라우저가 이어 준다(tailwind.css의 panel-dialog). 전환하는 동안만 루트에 data-vt="dialog"를
 * 붙여 대화상자에만 이름을 주고 페이지는 움직이지 않는다. 지원하지 않거나 움직임 줄이기면 바로 바꾼다.
 */
function swapDialog(apply: () => void) {
  const root = document.documentElement
  if (!("startViewTransition" in document) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    apply()
    return
  }
  root.dataset.vt = "dialog"
  const transition = document.startViewTransition(() => flushSync(apply))
  void transition.finished.finally(() => { delete root.dataset.vt })
}

const SIZE_MOTION: KeyframeAnimationOptions = { duration: 200, easing: "cubic-bezier(0.2, 0, 0, 1)" }

/**
 * 같은 대화상자 안에서 내용이 바뀌어(단계 넘김 등) 크기가 달라지면 앞 크기에서 새 크기로 움직여 간다(height: auto는 CSS transition이
 * 걸리지 않는다). 다른 대화상자로 바꿔 끼울 때의 크기는 화면 전환(swapDialog)이 맡는다.
 * 크기는 transform(여는 확대)을 빼고 잰다. 움직이는 동안의 크기 변화는 그 움직임의 것이라 건너뛴다. 움직임을 줄이는 설정이면 바로 바뀐다.
 */
function useSizeTransition(element: HTMLDivElement | null) {
  React.useLayoutEffect(() => {
    if (!element) return
    let last: Size | undefined
    let motion: Animation | undefined
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)")
    const observer = new ResizeObserver(() => {
      if (motion) return
      const next = { width: element.offsetWidth, height: element.offsetHeight }
      const moved = last && (Math.abs(last.height - next.height) > 1 || Math.abs(last.width - next.width) > 1)
      if (!moved || reduced.matches) { last = next; return }
      element.dataset.resizing = ""
      motion = element.animate([
        { width: `${last!.width}px`, height: `${last!.height}px`, overflow: "hidden" },
        { width: `${next.width}px`, height: `${next.height}px`, overflow: "hidden" },
      ], SIZE_MOTION)
      const settle = () => { motion = undefined; delete element.dataset.resizing; last = { width: element.offsetWidth, height: element.offsetHeight } }
      motion.onfinish = settle
      motion.oncancel = settle
    })
    observer.observe(element)
    return () => { observer.disconnect(); motion?.cancel(); delete element.dataset.resizing }
  }, [element])
}

function Dialog({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogOverlay({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) {
  const isHandedOff = !!React.useContext(DialogPanelContext)?.isSwapped
  return (
    <DialogPrimitive.Backdrop
      data-slot="dialog-overlay"
      className={cn(
        "fixed inset-0 isolate z-50 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs data-closed:animate-out data-closed:fade-out-0",
        !isHandedOff && "data-open:animate-in data-open:fade-in-0",
        className
      )}
      {...props}
    />
  )
}

function mergeRefs<T>(...refs: (React.Ref<T> | undefined)[]) {
  return (value: T | null) => {
    for (const each of refs) {
      if (typeof each === "function") each(value)
      else if (each) (each as React.RefObject<T | null>).current = value
    }
  }
}

function DialogContent({
  className,
  children,
  showCloseButton = true,
  ref,
  ...props
}: DialogPrimitive.Popup.Props & {
  showCloseButton?: boolean
}) {
  const panel = React.useContext(DialogPanelContext)
  const from = panel?.isSwapped
  // 팝업은 포털이 붙은 뒤에 생기므로 ref 객체가 아니라 상태로 받아, 생긴 때 크기 재기를 건다.
  const [element, setElement] = React.useState<HTMLDivElement | null>(null)
  const popupRef = React.useMemo(() => mergeRefs<HTMLDivElement>(setElement, ref), [ref])
  useSizeTransition(element)
  return (
    <DialogPortal><ButtonStyleReset>
      <DialogOverlay />
      <DialogPrimitive.Popup
        ref={popupRef}
        data-slot="dialog-content"
        data-panel={panel ? "" : undefined}
        className={cn(
          // 대화상자 하나의 모양: 너비는 45rem 하나(내용이 그 안을 다 쓴다), 화면 위 12%에서 뜨고, 머리 · 내용 · 바닥을
          // 구분선 없이 여백으로만 나눈다. 길면 내용(DialogBody)만 스크롤하고 위아래 끝이 서서히 사라진다.
          "fixed top-[12dvh] left-1/2 z-50 flex max-h-[76dvh] w-full max-w-[calc(100%-2rem)] -translate-x-1/2 flex-col gap-6 overflow-hidden rounded-2xl bg-popover px-10 pt-7 pb-6 text-sm text-popover-foreground ring-1 ring-foreground/10 duration-100 outline-none sm:max-w-180 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
          // 바꿔 낀 대화상자는 자기 여는 움직임 없이 화면 전환(swapDialog)에 맡긴다.
          !from && "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
          className
        )}
        {...props}
      >
        <DialogPanelContext.Provider value={null}>{children}</DialogPanelContext.Provider>
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            render={
              <Button
                variant="ghost"
                className="absolute top-7.5 right-8"
                size="icon-sm"
              />
            }
          >
            <XIcon
            />
            <span className="sr-only">닫기</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Popup>
    </ButtonStyleReset></DialogPortal>
  )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 pr-10", className)}
      {...props}
    />
  )
}

function DialogFooter({
  className,
  showCloseButton = false,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  showCloseButton?: boolean
}) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex shrink-0 flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    >
      {children}
      {showCloseButton && (
        <DialogPrimitive.Close render={<Button variant="outline" />}>
          닫기
        </DialogPrimitive.Close>
      )}
    </div>
  )
}

function DialogTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn(
        "font-heading text-xl leading-normal font-semibold",
        className
      )}
      {...props}
    />
  )
}

function DialogDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn(
        "text-sm text-muted-foreground *:[a]:underline *:[a]:underline-offset-3 *:[a]:hover:text-foreground",
        className
      )}
      {...props}
    />
  )
}

/**
 * 머리를 직접 꾸리는 대화상자의 머리 줄(목록 위 상세 · 양식 · 프로필): 앞(놓일 곳 칩), 이름, 그 뒤 도구 · 크게 보기 · 닫기.
 * 기본 닫기 단추(showCloseButton)를 끄고 쓴다.
 */
function DialogBar({ title, before, onExpand, children }: { title: React.ReactNode; before?: React.ReactNode; onExpand?: () => void; children?: React.ReactNode }) {
  return (
    <div data-slot="dialog-bar" className="flex min-w-0 shrink-0 items-center gap-3">
      {before}
      <DialogTitle className="min-w-0 flex-1 truncate">{title}</DialogTitle>
      <div className="-mr-1.5 flex shrink-0 items-center gap-1">
        {children}
        {/* 페이지로 열기(↗): 주소가 그 페이지로 바뀌므로 크게 보기(⤢, 같은 주소의 ?focus=1)와 다른 아이콘이다. */}
        {onExpand && <Button variant="ghost" size="icon-sm" aria-label="페이지로 열기" title="페이지로 열기" onClick={onExpand}><SquareArrowOutUpRightIcon /></Button>}
        <DialogClose render={<Button variant="ghost" size="icon-sm" aria-label="닫기" title="닫기" />}><XIcon /></DialogClose>
      </div>
    </div>
  )
}

const DialogBodyContext = React.createContext(false)

/**
 * 대화상자 본문 안인가. 본문은 대화상자가 여백 · 폭을 이미 정했으므로, 페이지에서 쓰던 가운데 단 · 여백 · 바탕을 두지 않고
 * 대화상자 폭을 그대로 쓴다(상세 · 관리 화면의 단).
 */
const useIsInDialogBody = () => React.useContext(DialogBodyContext)

/**
 * 대화상자의 스크롤하는 내용: 대화상자 폭을 끝까지 써서 스크롤 막대가 오른쪽 끝에 붙고, 위아래 끝은 구분선 대신 서서히 사라진다.
 * 대화상자가 자라거나 줄어드는 동안(data-resizing)은 스크롤하지 않는다: 그 사이 내용이 잠깐 넘쳐 막대가 생겼다 사라지며 내용이 좌우로
 * 흔들리지 않게. 막대 자리를 늘 비워 두는 방법(scrollbar-gutter)은 오른쪽 여백만 좁아져 머리의 닫기와 선이 어긋나 쓰지 않는다.
 */
function DialogBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <DialogBodyContext value>
      <div data-slot="dialog-body"
        className={cn("-mx-10 -my-3 flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain px-10 py-3 [scrollbar-width:thin] [[data-resizing]_&]:overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_0.75rem,black_calc(100%-0.75rem),transparent)]", className)}
        {...props} />
    </DialogBodyContext>
  )
}

export {
  Dialog,
  DialogBar,
  DialogBody,
  useIsInDialogBody,
  DialogClose,
  DialogContent,
  DialogPanel,
  swapDialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
}
