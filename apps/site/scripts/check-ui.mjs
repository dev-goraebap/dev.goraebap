import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

// shadcn 키트의 화면 코드 규칙 검사(apps/demo의 check-ui와 같은 규칙). npm run check:ui
// - FSD: 아래 계층이 위 계층을, 같은 계층의 다른 슬라이스를 가져오지 않는다. 슬라이스 밖에서는 index.ts로만 가져온다.
// - 스타일: 팔레트 색 클래스(bg-red-500 …), space-x/y-*, 수동 dark: 색, style={{}}를 쓰지 않는다.
//   style={{}}는 데이터 값일 때만 윗줄이나 같은 줄에 // check-ui: allow-style <사유>를 달고 쓴다.
// - 아이콘: lucide-react를 직접 가져오지 않는다(shared/ui/icon의 Solar).
// shadcn add로 만든 부품(SHADCN)은 FSD와 아이콘 규칙만 본다(스타일은 생성물의 관례를 따른다). demo는 shared/ui 바로 아래의
// 파일을 모두 생성물로 보지만, 여기서는 이름으로 골라 우리가 쓴 부품(action-menu · segmented-control …)도 스타일을 검사한다.
//
// 사이트는 Astryx 키트에서 옮겨 가는 중이라 src 전체가 아니라 아래 TARGETS만 검사한다. 화면을 shadcn으로 옮기면
// 그 폴더를 TARGETS에 더하고, Astryx를 걷어 내면 src 전체로 넓힌다. EXCLUDE는 옛 Astryx 키트 폴더다.
// 사이트 화면(app · pages · widgets · entities와 shared의 markdown · loading · config · styles)은 옮겼다. 견본(samples/)은 src 밖이라
// 여기서 보지 않는다.

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../src")
const TARGETS = ["shared/ui", "shared/lib", "shared/markdown", "shared/loading", "shared/config", "shared/styles", "entities", "widgets", "pages", "app"]
const EXCLUDE = ["shared/ui/foundations", "shared/ui/composites", "shared/ui/layouts", "shared/ui/patterns"]
const LAYERS = ["app", "pages", "widgets", "features", "entities", "shared"]
const PALETTE = /\b(?:bg|text|border|ring|fill|stroke|from|to|via|outline|decoration|shadow)-(?:red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone)-\d{2,3}\b/
const SPACE = /\bspace-[xy]-/
const DARK_COLOR = /\bdark:(?:bg|text|border)-/
const STYLE = /style=\{\{/
const SHADCN = new Set(["alert-dialog", "alert", "avatar", "badge", "breadcrumb", "button", "calendar", "card", "checkbox", "command",
  "dialog", "drawer", "dropdown-menu", "empty", "field", "input-group", "input", "item", "label", "popover", "progress", "scroll-area",
  "select", "separator", "sheet", "sidebar", "skeleton", "spinner", "switch", "table", "tabs", "textarea", "toast", "toggle-group",
  "toggle", "tooltip"])

const relative = file => path.relative(root, file).split(path.sep).join("/")
const files = []
function walk(dir) {
  if (!fs.existsSync(dir)) return
  for (const name of fs.readdirSync(dir)) {
    const file = path.join(dir, name)
    if (EXCLUDE.includes(relative(file))) continue
    if (fs.statSync(file).isDirectory()) walk(file)
    else if (/\.(tsx?|css)$/.test(name) && !name.endsWith(".generated.ts")) files.push(file)
  }
}
TARGETS.forEach(target => walk(path.join(root, target)))

const problems = []
const report = (file, line, message) => problems.push(`${relative(file)}:${line} ${message}`)
const where = file => {
  const [layer, slice] = relative(file).split("/")
  return { layer, slice: layer === "app" || layer === "shared" ? layer : slice }
}

for (const file of files) {
  const source = fs.readFileSync(file, "utf8")
  const lines = source.split("\n")
  const from = where(file)
  const isGenerated = SHADCN.has(/^shared\/ui\/([^/]+)\.tsx$/.exec(relative(file))?.[1] ?? "")
  lines.forEach((text, index) => {
    const line = index + 1
    const imported = /from\s+["']([^"']+)["']/.exec(text)?.[1]
    if (imported === "lucide-react") report(file, line, "lucide-react 대신 @/shared/ui/icon")
    if (imported?.startsWith("@/")) {
      const [layer, slice, ...rest] = imported.slice(2).split("/")
      if (LAYERS.includes(layer) && LAYERS.includes(from.layer)) {
        if (LAYERS.indexOf(layer) < LAYERS.indexOf(from.layer)) report(file, line, `${from.layer}가 위 계층 ${layer}를 가져옴`)
        else if (layer === from.layer && slice !== from.slice && layer !== "shared") report(file, line, `같은 계층의 다른 슬라이스 ${layer}/${slice}를 가져옴`)
        else if (layer !== from.layer && layer !== "shared" && rest.length > 0) report(file, line, `${layer}/${slice}의 공개 진입점(index.ts) 대신 내부 파일을 가져옴`)
      }
    }
    if (isGenerated) return
    if (PALETTE.test(text)) report(file, line, "팔레트 색 클래스 대신 의미 토큰")
    if (SPACE.test(text)) report(file, line, "space-x/y 대신 flex + gap")
    if (DARK_COLOR.test(text)) report(file, line, "dark: 색 덮어쓰기 대신 토큰")
    if (STYLE.test(text) && !/check-ui: allow-style/.test(lines[index - 1] ?? "") && !/check-ui: allow-style/.test(text)) report(file, line, "style={{}} 대신 클래스(데이터 값이면 윗줄에 // check-ui: allow-style 사유)")
  })
}

if (problems.length) {
  console.error(`화면 규칙 위반 ${problems.length}건\n${problems.join("\n")}`)
  process.exit(1)
}
console.log(`화면 규칙 통과: ${files.length}개 파일(${TARGETS.join(", ")})`)
