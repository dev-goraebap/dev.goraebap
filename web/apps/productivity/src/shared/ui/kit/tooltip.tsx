"use client"

import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip"
import { cn } from "cn"
import * as React from "react"

/*
 * Base UI 툴팁은 보이기만 하고 읽는 이름 · 설명을 잇지 않는다. 그래서 열린 동안 내용에 role="tooltip"과 id를 두고,
 * 트리거에 aria-describedby로 잇는다(WAI-ARIA Tooltip 패턴). 초점을 받으면 열리므로 키보드 · 화면 낭독기도 설명을 읽는다.
 * 내용을 숨겨 둔 툴팁(펼친 사이드바의 hidden)은 잇지 않는다.
 */
type TooltipLink = { id: string; isOpen: boolean; setHidden: (isHidden: boolean) => void }
const TooltipLinkContext = React.createContext<TooltipLink | null>(null)

function TooltipProvider({
  delay = 0,
  ...props
}: TooltipPrimitive.Provider.Props) {
  return (
    <TooltipPrimitive.Provider
      data-slot="tooltip-provider"
      delay={delay}
      {...props}
    />
  )
}

function Tooltip({ open, defaultOpen = false, onOpenChange, ...props }: TooltipPrimitive.Root.Props) {
  const id = React.useId()
  const [isOpenInside, setOpenInside] = React.useState(defaultOpen)
  const [isHidden, setHidden] = React.useState(false)
  const isOpen = (open ?? isOpenInside) && !isHidden
  const link = React.useMemo(() => ({ id, isOpen, setHidden }), [id, isOpen])
  return (
    <TooltipLinkContext.Provider value={link}>
      <TooltipPrimitive.Root data-slot="tooltip" open={open} defaultOpen={defaultOpen}
        onOpenChange={(next, details) => { setOpenInside(next); onOpenChange?.(next, details) }} {...props} />
    </TooltipLinkContext.Provider>
  )
}

function TooltipTrigger({ ...props }: TooltipPrimitive.Trigger.Props) {
  const link = React.useContext(TooltipLinkContext)
  return (
    <TooltipPrimitive.Trigger data-slot="tooltip-trigger" aria-describedby={link?.isOpen ? link.id : undefined} {...props} />
  )
}

function TooltipContent({
  className,
  side = "top",
  sideOffset = 4,
  align = "center",
  alignOffset = 0,
  children,
  id,
  ...props
}: TooltipPrimitive.Popup.Props &
  Pick<
    TooltipPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset"
  >) {
  const link = React.useContext(TooltipLinkContext)
  const setHidden = link?.setHidden
  const isHidden = Boolean(props.hidden)
  React.useLayoutEffect(() => setHidden?.(isHidden), [setHidden, isHidden])
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className="isolate z-50"
      >
        <TooltipPrimitive.Popup
          data-slot="tooltip-content"
          role="tooltip"
          id={id ?? link?.id}
          className={cn(
            "z-50 inline-flex w-fit max-w-xs origin-(--transform-origin) items-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs text-background has-data-[slot=kbd]:pr-1.5 data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 **:data-[slot=kbd]:relative **:data-[slot=kbd]:isolate **:data-[slot=kbd]:z-50 **:data-[slot=kbd]:rounded-sm data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className
          )}
          {...props}
        >
          {children}
          <TooltipPrimitive.Arrow className="z-50 size-2.5 translate-y-[calc(-50%-2px)] rotate-45 rounded-[2px] bg-foreground fill-foreground data-[side=bottom]:top-1 data-[side=inline-end]:top-1/2! data-[side=inline-end]:-left-1 data-[side=inline-end]:-translate-y-1/2 data-[side=inline-start]:top-1/2! data-[side=inline-start]:-right-1 data-[side=inline-start]:-translate-y-1/2 data-[side=left]:top-1/2! data-[side=left]:-right-1 data-[side=left]:-translate-y-1/2 data-[side=right]:top-1/2! data-[side=right]:-left-1 data-[side=right]:-translate-y-1/2 data-[side=top]:-bottom-2.5" />
        </TooltipPrimitive.Popup>
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
