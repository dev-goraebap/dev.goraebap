import { Extension } from "@tiptap/core"
import { Plugin, PluginKey, type EditorState } from "@tiptap/pm/state"
import { Decoration, DecorationSet, type EditorView } from "@tiptap/pm/view"
import { useState } from "react"
import { createRoot } from "react-dom/client"
import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import { UploadIcon, XIcon } from "@/shared/ui/icon"

/**
 * 파일을 올릴 자리. `/` 명령의 파일이나 HTML 임베드를 고르면 본문의 그 자리에 점선 칸이 뜬다(HTML 칸은 .html만 고르게 한다).
 * 누르면 파일 고르기가 열리고, 파일을 끌어다 놓아도 된다. 칸은 문서에 저장되지 않는 화면 표시(decoration)라서 파일을 올리지
 * 않고 닫아도 본문에 남는 것이 없다. 파일이 올라가기 시작하면 칸은 닫히고 그 자리에 파일 블록이 들어간다.
 */
export type UploadZoneKind = "file" | "html"
type ZoneState = { pos: number | null; kind: UploadZoneKind }
type Storage = { pick: (kind: UploadZoneKind) => void }
export const uploadZoneKey = new PluginKey<ZoneState>("uploadZone")

/** 칸이 열려 있는 문서 위치. 닫혀 있으면 null. */
export const uploadZonePos = (state: EditorState) => uploadZoneKey.getState(state)?.pos ?? null
export const closeUploadZone = (view: EditorView) => {
  if (uploadZonePos(view.state) !== null) view.dispatch(view.state.tr.setMeta(uploadZoneKey, { pos: null, kind: "file" }))
}
/** 커서가 있는 블록 자리에 칸을 연다: 빈 줄이면 그 줄 앞에, 글이 있으면 그 블록 뒤에. */
export function openUploadZone(view: EditorView, kind: UploadZoneKind = "file") {
  const { $from } = view.state.selection
  const isEmptyLine = $from.parent.isTextblock && $from.parent.content.size === 0
  const pos = $from.depth ? (isEmptyLine ? $from.before() : $from.after()) : $from.pos
  view.dispatch(view.state.tr.setMeta(uploadZoneKey, { pos, kind }))
}

const WORDS: Record<UploadZoneKind, [pick: string, hint: string]> = {
  html: ["HTML 파일을 눌러서 올리기", "HTML 파일(.html) 하나에 최대 10MB · 본문에 미리보기로 들어갑니다"],
  file: ["눌러서 올리기", "사진 · 동영상 · 오디오 · 파일, 하나에 최대 10MB"],
}

/** 점선 칸 모양. 링크 카드의 주소 넣는 칸(SourceView)도 같은 모양을 쓴다. */
export const ZONE = "relative my-5 rounded-xl border-[1.5px] border-dashed border-input bg-accent transition-colors hover:border-ring hover:bg-pressed data-over:border-ring data-over:bg-pressed"
export const ZONE_ART = "grid size-11 flex-none place-items-center rounded-full bg-primary text-primary-foreground [&_svg]:size-5.5"

/** 칸의 내용. 끌어 온 동안의 표시만 맡고, 놓은 파일을 올리는 일은 에디터 틀이 한다(RichEditor의 onDropCapture). */
function Zone({ kind, onPick, onClose }: { kind: UploadZoneKind; onPick: () => void; onClose: () => void }) {
  const [isOver, setOver] = useState(false)
  const [pick, hint] = WORDS[kind]
  return (
    <div role="group" aria-label={kind === "html" ? "HTML 파일 올리는 칸" : "파일 올리는 칸"} data-over={isOver || undefined} className={ZONE}
      onKeyDown={event => { if (event.key === "Escape") { event.preventDefault(); onClose() } }}
      onDragOver={event => { if (event.dataTransfer.types.includes("Files")) { event.preventDefault(); setOver(true) } }}
      onDragLeave={() => setOver(false)} onDrop={() => setOver(false)}>
      <button type="button" onClick={onPick}
        className="flex w-full cursor-pointer flex-col items-center gap-2 rounded-[inherit] px-4 py-9 text-sm text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
        <span className={ZONE_ART}><UploadIcon /></span>
        <span><u>{pick}</u> 또는 끌어다 놓기</span>
        <span className="text-xs text-muted-foreground">{hint}</span>
      </button>
      <Button variant="ghost" size="icon-sm" aria-label="올리는 칸 닫기" title="닫기" className={cn("absolute top-2 right-2 text-icon-muted max-md:size-11")} onClick={onClose}>
        <XIcon />
      </Button>
    </div>
  )
}

/**
 * 칸은 ProseMirror의 위젯이라 React 트리 바깥의 DOM이다. 그 DOM에 따로 React 뿌리를 두어 키트 부품으로 그리고, 위젯이 빠지면 거둔다.
 * (거두기는 다음 틈에 한다: 위젯은 React가 그리는 도중에 빠질 수 있고, 그때 바로 거두면 React가 경고한다.)
 */
function zone(view: EditorView, storage: Storage, kind: UploadZoneKind) {
  const box = document.createElement("div")
  box.contentEditable = "false"
  const root = createRoot(box)
  const close = () => { closeUploadZone(view); view.focus() }
  root.render(<Zone kind={kind} onPick={() => storage.pick(kind)} onClose={close} />)
  return Object.assign(box, { unmountZone: () => queueMicrotask(() => root.unmount()) })
}

export const UploadZone = Extension.create<Record<string, never>, Storage>({
  name: "uploadZone",
  addStorage() { return { pick: () => undefined } },
  addProseMirrorPlugins() {
    const storage = this.storage
    return [new Plugin<ZoneState>({
      key: uploadZoneKey,
      state: {
        init: () => ({ pos: null, kind: "file" }),
        apply(tr, value) {
          const meta = tr.getMeta(uploadZoneKey) as ZoneState | undefined
          if (meta) return meta
          return value.pos === null ? value : { ...value, pos: tr.mapping.map(value.pos) }
        },
      },
      props: {
        decorations(state) {
          const { pos, kind } = uploadZoneKey.getState(state)!
          return pos === null ? null : DecorationSet.create(state.doc, [Decoration.widget(pos, view => zone(view, storage, kind),
            { side: -1, key: `upload-zone-${kind}`, stopEvent: () => true, ignoreSelection: true,
              destroy: node => (node as HTMLElement & { unmountZone?: () => void }).unmountZone?.() })])
        },
      },
    })]
  },
})
