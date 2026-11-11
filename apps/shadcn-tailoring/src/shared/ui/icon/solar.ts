import { createElement, type SVGProps } from "react"

export type IconProps = SVGProps<SVGSVGElement> & {
  /** 고름 · 열림 · 지금 자리면 같은 아이콘의 Bold Duotone으로 그린다(없으면 Linear). */
  chosen?: boolean
}
export type Icon = ((props: IconProps) => React.ReactElement) & { displayName?: string }

/**
 * Solar 아이콘 하나를 부품으로 만든다. 24 격자 SVG이고 기본 크기는 1rem이다. 부품 안에서는 부품의 size-* 규칙이 크기를 정한다.
 * 장식이라 접근성 트리에서 숨긴다.
 */
export function solar(name: string, linear: string, boldDuotone?: string): Icon {
  // children은 버린다: Base UI의 render로 아이콘을 넘기면 기본 자식(예: Select의 ▼)이 함께 와서 그림 본문과 부딪힌다.
  const Icon: Icon = ({ chosen, children: _children, ...props }) =>
    createElement("svg", {
      viewBox: "0 0 24 24", width: "1rem", height: "1rem", "aria-hidden": true, focusable: false, ...props,
      dangerouslySetInnerHTML: { __html: chosen && boldDuotone ? boldDuotone : linear },
    })
  Icon.displayName = `Solar(${name})`
  return Icon
}
