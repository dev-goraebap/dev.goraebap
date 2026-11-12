import type { Plugin } from "vite"
import { BOOT_MARK } from "./boot-mark"

/**
 * 덮개가 CSS보다 먼저 쓰는 색(라이트, 다크). tailwind.css 토큰과 같은 값이다: 바탕 --background, 잉크 --muted-foreground,
 * 그림의 면 --card. 토큰을 바꾸면 여기도 맞춘다(앱 스크립트 · CSS가 오기 전의 첫 그림이라 변수를 읽을 수 없다).
 */
export const BOOT_COLORS = {
  background: ["#f9f9fa", "#121213"],
  ink: ["#5c5c5e", "#8a8f98"],
  surface: ["#fefefe", "#19191a"],
} as const

const pair = (key: keyof typeof BOOT_COLORS) => `light-dark(${BOOT_COLORS[key][0]},${BOOT_COLORS[key][1]})`

/**
 * 첫 방문 덮개를 index.html에 넣는 Vite 플러그인. 앱 스크립트가 오기 전에도 테마 색의 덮개(그림 + "불러오는 중입니다")가
 * 바로 보이고, 앱이 뜨면 같은 모양의 BootCover가 이어받는다.
 *
 *   plugins: [react(), tailwindcss(), bootCover({ mark: readFileSync("src/app/boot-mark.svg", "utf8") })]
 *
 * index.html의 앱 자리는 `<div id="root"></div>`여야 한다. modeKey는 라이트 · 다크를 저장한 localStorage 키다:
 * 값이 'light' · 'dark' 글자이거나 { mode } JSON(lib/appearance)이면 그것을, 아니면 시스템 설정을 따른다. 고른 모드는
 * html의 data-theme과 color-scheme에 미리 반영해 CSS가 오는 순간에도 다른 모드가 비치지 않게 한다.
 */
export function bootCover({ mark = BOOT_MARK, modeKey = "appearance", label = "불러오는 중입니다", rootId = "root", include }: {
  /** 그림 SVG 원문. 선은 rgb(0,0,0), 면은 rgb(254,254,255)로 그리면 테마 색으로 바뀐다. 없으면 중립 기본 그림. */
  mark?: string
  modeKey?: string
  label?: string
  rootId?: string
  /** 덮개를 넣을 HTML(예: path => path === "/index.html"). 없으면 모든 HTML 입구. */
  include?: (path: string) => boolean
} = {}): Plugin {
  const style = "<style>.boot{position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.75rem;margin:0;"
    + `background:${pair("background")};color:${pair("ink")};font:.75rem/1.5 'Pretendard Variable',Pretendard,system-ui,sans-serif}`
    + ".boot-mark{width:10rem;height:10rem;margin:0}.boot-mark svg{display:block;width:100%;height:100%}"
    + `.boot-mark [stroke="rgb(0,0,0)"]{stroke:currentColor}.boot-mark [fill="rgb(0,0,0)"]{fill:currentColor}`
    + `.boot-mark [fill="rgb(254,254,255)"]{fill:${pair("surface")}}</style>`
  const themeMeta = `<meta name="theme-color" content="${BOOT_COLORS.background[0]}">`
  const mode = `<script>(function(){var m;try{m=localStorage.getItem(${JSON.stringify(modeKey)});var j=JSON.parse(m);if(j&&j.mode)m=j.mode}catch(e){}`
    + "var d=m==='dark'||(m!=='light'&&matchMedia('(prefers-color-scheme: dark)').matches),h=document.documentElement;"
    + "h.dataset.theme=d?'dark':'light';h.style.colorScheme=d?'dark':'light';"
    + `var c=d?${JSON.stringify(BOOT_COLORS.background[1])}:${JSON.stringify(BOOT_COLORS.background[0])};`
    + "var t=document.querySelector('meta[name=\"theme-color\"]');if(t)t.content=c;h.style.backgroundColor=c})()</script>"
  const cover = `<section class="boot" role="status" aria-label="${label}"><figure class="boot-mark" aria-hidden="true">${mark}</figure>${label}</section>`
  return {
    name: "boot-cover",
    transformIndexHtml(html, context) {
      if (include && context && !include(context.path)) return html
      const slot = `<div id="${rootId}"></div>`
      if (!html.includes(slot)) throw new Error(`bootCover: index.html에 ${slot}이 없습니다.`)
      const meta = /<meta\b[^>]*\bname=["']theme-color["']/i.test(html) ? "" : themeMeta
      return html.replace("</head>", `${style}${meta}${mode}</head>`).replace(slot, `<div id="${rootId}">${cover}</div>`)
    },
  }
}
