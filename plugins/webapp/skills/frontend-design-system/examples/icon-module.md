---
arc42: "8.5, 2"
---

# 공통 아이콘 모듈

화면은 아이콘 세트를 직접 가져오지 않고 공통 아이콘 모듈에서 뜻을 나타내는 이름으로 부르며, 이름에서 실제 아이콘으로 가는 매핑은 한 곳에 둡니다. 규칙은 [아이콘](../references/icons.md)에 있습니다.

## react

출처: [web/scripts/generate-ui-icons.mjs](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/scripts/generate-ui-icons.mjs)

```js
import fs from "node:fs/promises"

// 키트 아이콘(src/shared/ui/kit/icon)을 만드는 생성기.
// shadcn 키트(src/shared/ui/kit/icon)가 부르는 아이콘 이름(lucide와 같은 이름)과 그 이름이 그리는 Solar 아이콘. 기본은 Linear,
// chosen(고름 · 열림 · 지금 자리)이면 같은 아이콘의 Bold Duotone이다. 이름을 더하면 npm run icons:ui로 다시 만든다.
// 이름이 lucide와 같은 것은 shadcn add가 만든 부품의 lucide-react import를 @/shared/ui/icon으로 바꾸기만 하면 되게 하려는 것이다.
const SOLAR = {
  // shadcn 부품이 쓰는 것
  ArrowDownIcon: "arrow-down", ArrowLeftIcon: "arrow-left", ArrowUpIcon: "arrow-up", ArrowUpDownIcon: "sort-vertical",
  CheckIcon: "check", ChevronDownIcon: "alt-arrow-down", ChevronLeftIcon: "alt-arrow-left", ChevronRightIcon: "alt-arrow-right",
  ChevronUpIcon: "alt-arrow-up", ChevronsLeftIcon: "double-alt-arrow-left", ChevronsRightIcon: "double-alt-arrow-right",
  CircleCheckIcon: "check-circle", EllipsisIcon: "menu-dots", MoreHorizontalIcon: "menu-dots", InfoIcon: "info-circle",
  // …
}

const solar = JSON.parse(await fs.readFile(new URL("../node_modules/@iconify-json/solar/icons.json", import.meta.url), "utf8"))
const body = (key, style) => solar.icons[`${key}-${style}`]?.body
const lines = Object.entries(SOLAR).map(([name, key]) => {
  const linear = body(key, "linear")
  if (!linear) throw new Error(`Solar 아이콘 없음: ${key}-linear`)
  const chosen = body(key, "bold-duotone")
  // 순수 표시: 표시가 없으면 묶을 때 solar() 호출을 지우지 못해, 아이콘 하나만 가져와도 전부(약 209KB)가 따라온다.
  return `export const ${name} = /* @__PURE__ */ solar(${JSON.stringify(name)}, ${JSON.stringify(linear)}${chosen ? `, ${JSON.stringify(chosen)}` : ""})`
})
// 머리 주석은 import 뒤에 둔다. shadcn add가 첫 문장 앞의 주석을 지우므로 앞에 두면 받은 프로젝트에서 저작자 표시가 사라진다.
await fs.writeFile(new URL("../src/shared/ui/kit/icon/icons.generated.ts", import.meta.url),
  `import { solar } from "./solar"\n\n// npm run icons:ui로 생성한다. 직접 고치지 않는다.\n// Solar icons by 480 Design, CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/).\n${lines.join("\n")}\n`)
```

생성기의 `SOLAR` 표가 이름과 Solar 아이콘을 잇는 유일한 매핑이고, 표에 적은 이름만 `icons.generated.ts`로 만듭니다. 이름마다 선 형태(Linear)와 같은 아이콘의 채운 두 톤 형태(Bold Duotone)를 함께 넣습니다.

출처: [web/src/shared/ui/kit/icon/solar.ts](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/src/shared/ui/kit/icon/solar.ts)

```ts
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
  // 그림 본문 객체는 한 번만 만든다: 그릴 때마다 새 객체를 넘기면 React가 매번 innerHTML을 다시 넣고, 그 변화를 지켜보는
  // 부품(Base UI 토스트의 높이 재기)이 다시 그리게 해 끝없이 돈다.
  const plain = { __html: linear }
  const bold = boldDuotone ? { __html: boldDuotone } : plain
  // children은 버린다: Base UI의 render로 아이콘을 넘기면 기본 자식(예: Select의 ▼)이 함께 와서 그림 본문과 부딪힌다.
  const Icon: Icon = ({ chosen, children: _children, ...props }) =>
    createElement("svg", {
      viewBox: "0 0 24 24", width: "1rem", height: "1rem", "aria-hidden": true, focusable: false, ...props,
      dangerouslySetInnerHTML: chosen ? bold : plain,
    })
  Icon.displayName = `Solar(${name})`
  return Icon
}
```

출처: [web/src/shared/ui/kit/icon/index.ts](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/src/shared/ui/kit/icon/index.ts)

```ts
export * from "./icons.generated"
export type { Icon, IconProps } from "./solar"
```

선택 여부는 `chosen` 속성 하나로 넘깁니다. 화면은 `@/shared/ui/kit/icon`에서 `SearchIcon`처럼 뜻으로 지은 이름을 가져옵니다.
