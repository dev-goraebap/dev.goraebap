import type { Editor } from "@tiptap/core"
import { closeHistory } from "@tiptap/pm/history"
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from "@tiptap/react"
import { useEffect, useLayoutEffect, useRef, useState, type ComponentProps, type CSSProperties, type ReactNode } from "react"
import { cn } from "cn"
import { Button } from "@/shared/ui/button"
import { CheckIcon, ChevronDownIcon, CopyIcon, DownloadIcon, FileTextIcon, OctagonXIcon, RefreshCwIcon, ZoomInIcon } from "@/shared/ui/icon"
import { bytes, clampWidth, FILE_TONE_CLASS, fileKind } from "./file-kinds"
import { EditorMenu } from "./menu"
import { Media, safeSource } from "./schema"
import { Tip } from "./tool"
import { HTML_SANDBOX, useEditorHost } from "./zoom"

/** 노드 뷰 안에서 지금 편집할 수 있는지. 읽기 · 편집을 오가도 노드 뷰는 다시 만들어지지 않는다. */
export function useEditable(editor: Editor) {
  const [isEditable, setEditable] = useState(editor.isEditable)
  useEffect(() => {
    const update = () => setEditable(editor.isEditable)
    editor.on("transaction", update); editor.on("update", update); update()
    return () => { editor.off("transaction", update); editor.off("update", update) }
  }, [editor])
  return isEditable
}

/**
 * 블록 위에 떠 있는 도구 띠: 포인터를 올리거나 초점이 들어오면 블록 오른쪽 위에 뜬다(머리 띠를 두지 않는다). 터치 화면은 늘 보인다.
 * 부모에 group/block을 단다. isStatic이면 제자리(파일 카드 안 · 오디오 아래)에 늘 보인다.
 */
export function BlockTools({ isStatic = false, children }: { isStatic?: boolean; children: ReactNode }) {
  return (
    <div className={cn("z-2 flex items-center gap-0.5 print:hidden",
      isStatic ? "" : "absolute top-2 right-2 rounded-[0.5625rem] border border-input bg-popover p-0.5 shadow-md opacity-0 transition-opacity group-hover/block:opacity-100 group-focus-within/block:opacity-100 pointer-coarse:opacity-100 motion-reduce:transition-none")}>
      {children}
    </div>
  )
}

/** 도구 띠의 아이콘 단추. 휴대폰은 44px. */
export function BlockTool({ label, tip = label, children, ...props }: { label: string; tip?: string; children: ReactNode } & Omit<ComponentProps<typeof Button>, "children">) {
  return <Tip label={tip}><Button variant="ghost" size="icon-sm" aria-label={label} className="text-icon-muted hover:text-foreground max-md:size-11" {...props}>{children}</Button></Tip>
}

/** 원문을 복사하는 도구. 결과는 잠시 아이콘과 상태 문구로 알린다. */
export function CopyButton({ text, label }: { text: string; label: string }) {
  const [state, setState] = useState<"idle" | "copied" | "error">("idle")
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])
  return (
    <BlockTool label={label} tip={state === "copied" ? "복사됨" : state === "error" ? "복사하지 못했습니다" : label}
      onClick={async () => {
        try { await navigator.clipboard.writeText(text); setState("copied") } catch { setState("error") }
        clearTimeout(timer.current); timer.current = setTimeout(() => setState("idle"), 1800)
      }}>
      {state === "copied" ? <CheckIcon /> : state === "error" ? <OctagonXIcon /> : <CopyIcon />}
    </BlockTool>
  )
}

/** 이미 받은 사진: 다시 나오면 바로 보인다(서서히 나타나지 않는다). */
const arrived = new Set<string>()
const isAtHand = (src: string) => {
  if (!src) return false
  if (arrived.has(src)) return true
  const probe = new Image()
  probe.src = src
  return probe.complete && probe.naturalWidth > 0
}

const LABELS = { image: "이미지", video: "동영상", audio: "오디오", file: "파일" } as const
const WIDTHS = [25, 50, 75, 100]

/** 사진 · 동영상의 너비 고르기(25 · 50 · 75 · 100%, 저장된 본문의 다른 값은 그 값도 보인다). */
function WidthMenu({ width, onChange }: { width: number; onChange: (value: number) => void }) {
  const [isOpen, setOpen] = useState(false)
  return (
    <EditorMenu label="미디어 너비" open={isOpen} onOpenChange={setOpen} align="end" className="w-32"
      entries={[...(!WIDTHS.includes(width) ? [width] : []), ...WIDTHS].map(value => ({ kind: "item", label: `${value}%`, isChecked: value === width, onSelect: () => onChange(value) }))}
      trigger={<Tip label="미디어 너비"><Button variant="ghost" size="sm" aria-label={`미디어 너비 ${width}%`} className="gap-0.5 px-1.5 text-xs max-md:h-11">{width}%<ChevronDownIcon /></Button></Tip>} />
  )
}

/**
 * 사진 · 동영상 · 오디오 · 파일 블록. 머리 띠 · 상자 틀 · 사진 아래 이름 줄이 없다. 도구(크게 보기 · 너비 · 내려받기)는 포인터를 올리거나
 * 초점이 들어오면 블록 오른쪽 위에 뜬다. 사진은 올릴 때 잰 원본 비율로 자리를 먼저 잡고 대표색으로 칠한 뒤 나타나며, 너비를
 * 25% · 50%로 줄인 사진끼리는 한 줄에 나란히 놓인다(prose의 규칙). 파일은 확장자의 색을 띤 카드로, HTML 파일은 그 아래 격리된 미리보기 틀로 보인다.
 * 사진 · 영상 · 격리 틀은 키트 부품이 없어 <img> · <video> · <audio> · <iframe>을 그대로 쓰고, 비율 · 대표색 · 너비는 블록마다 달라 인라인으로 준다.
 */
function MediaView({ node, editor, updateAttributes, getPos, selected }: NodeViewProps) {
  const isEditable = useEditable(editor), { openZoom, openHtml } = useEditorHost(), a = node.attrs
  const mime = String(a.mime), name = String(a.name)
  const kind = mime.startsWith("image/") ? "image" : mime.startsWith("video/") ? "video" : mime.startsWith("audio/") ? "audio" : "file"
  const safe = safeSource(a.src), width = clampWidth(a.width), label = LABELS[kind]
  const [state, setState] = useState<"loading" | "ready" | "error">("loading"), [retry, setRetry] = useState(0), [size, setSize] = useState(Number(a.size) || 0)
  const stage = useRef<HTMLDivElement>(null), picture = useRef<HTMLImageElement>(null), [isNearby, setNearby] = useState(false)
  const src = retry && !safe.startsWith("blob:") ? `${safe}${safe.includes("?") ? "&" : "?"}retry=${retry}` : safe
  // 올릴 때 잰 대표색과 원본 비율이 있으면 자리를 먼저 그 색 · 비율로 칠하고, 받아야 하는 사진만 서서히 나타낸다(이미 받은 사진은 바로).
  const color = kind === "image" && typeof a.color === "string" && /^#[0-9a-fA-F]{6}$/.test(a.color) ? a.color : undefined
  const ratio = kind === "image" && Number(a.pixelWidth) > 0 && Number(a.pixelHeight) > 0 ? `${a.pixelWidth} / ${a.pixelHeight}` : undefined
  const [atHand] = useState(() => isAtHand(safe))
  useLayoutEffect(() => {
    setState("loading")
    if (!safe) { setState("error"); return }
    if (kind !== "file") return
    if (safe.startsWith("blob:")) { setSize(Number(a.size) || 0); setState("ready"); return }
    const controller = new AbortController()
    void fetch(src, { method: "HEAD", signal: controller.signal })
      .then(response => { if (!response.ok) throw Error(); setSize(Number(response.headers.get("content-length")) || Number(a.size) || 0); setState("ready") })
      .catch(error => { if (error.name !== "AbortError") setState("error") })
    return () => controller.abort()
  }, [src, kind, safe])
  useEffect(() => {
    if (!stage.current) return
    const observer = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) setNearby(true) }, { rootMargin: "300px" })
    observer.observe(stage.current)
    return () => observer.disconnect()
  }, [kind])
  useEffect(() => {
    if (state !== "loading" || (kind !== "file" && !isNearby)) return
    const timer = setTimeout(() => setState("error"), 15000)
    return () => clearTimeout(timer)
  }, [state, retry, isNearby, kind])
  const changeWidth = (value: number) => {
    editor.view.dispatch(closeHistory(editor.state.tr))
    updateAttributes({ width: value })
    editor.view.dispatch(closeHistory(editor.state.tr))
    const pos = getPos()
    if (typeof pos === "number") editor.chain().focus().setNodeSelection(pos).run()
  }
  const status = state === "loading" && color ? null
    : state === "error" ? (
      <div role="alert" className={cn("flex min-h-24 flex-col items-center justify-center gap-2 p-6 text-center text-muted-foreground", kind !== "file" && "absolute inset-0")}>
        <OctagonXIcon className="text-destructive" /><span className="text-sm font-medium text-foreground">{label}를 불러오지 못했습니다</span>
        <span className="text-xs">연결이나 파일 상태를 확인해 주세요.</span>
        <Button variant="secondary" size="sm" className="max-md:h-11" onClick={() => setRetry(n => n + 1)}><RefreshCwIcon data-icon="inline-start" />다시 시도</Button>
      </div>
    ) : state === "loading" ? (
      <div role="status" className={cn("pointer-events-none flex min-h-24 items-center justify-center gap-2 bg-muted p-6 text-xs text-muted-foreground", kind !== "file" && "absolute inset-0")}>
        <RefreshCwIcon className="animate-spin motion-reduce:animate-none" />{label} 불러오는 중…
      </div>
    ) : null
  const zoom = () => {
    const image = picture.current
    if (image) openZoom({ src: image.currentSrc || src, alt: name, width: Number(a.pixelWidth) || image.naturalWidth || undefined, height: Number(a.pixelHeight) || image.naturalHeight || undefined })
  }
  const file = fileKind(name)
  // HTML 파일은 카드 아래에 미리보기를 둔다. 올린 사람의 스크립트가 들어 있을 수 있으므로 격리된 틀(sandbox, 같은 출처 권한 없음)
  // 안에서만 그린다: 틀 안의 문서는 이 앱의 화면 · 쿠키 · 저장소에 닿지 못한다.
  const isHtml = kind === "file" && (mime === "text/html" || /\.html?$/i.test(name))
  const tools = (
    <BlockTools isStatic={kind === "file" || kind === "audio"}>
      {kind === "image" && state === "ready" ? <BlockTool label={`${name} 크게 보기`} tip="크게 보기" onClick={zoom}><ZoomInIcon /></BlockTool> : null}
      {isHtml && safe && state !== "error" ? <BlockTool label={`${name} 크게 보기`} tip="크게 보기" onClick={() => openHtml({ src, title: name })}><ZoomInIcon /></BlockTool> : null}
      {isEditable && (kind === "image" || kind === "video") ? <WidthMenu width={width} onChange={changeWidth} /> : null}
      <BlockTool label={`${name} 다운로드`} tip="다운로드" nativeButton={false} render={<a href={safe || undefined} download={name} />}><DownloadIcon /></BlockTool>
    </BlockTools>
  )
  // 사진의 자리: 원본 비율을 알면 그 비율로, 너무 긴 사진은 높이 한도(32rem)에 맞춘 폭으로 잡아 가운데에 둔다.
  const box: CSSProperties | undefined = kind === "image" && ratio && state !== "error"
    ? { aspectRatio: ratio, inlineSize: `min(100%, calc(32rem * ${a.pixelWidth} / ${a.pixelHeight}))`, backgroundColor: state === "ready" ? undefined : color }
    : state === "error" ? undefined : { backgroundColor: color }
  return (
    <NodeViewWrapper as="figure" data-kind={kind} data-html={isHtml ? "" : undefined} data-selected={selected && isEditable ? "" : undefined}
      data-media="" data-width={width} data-block-id={a.blockId} data-media-state={state} contentEditable={false}
      className={cn("group/block relative mx-auto my-(--block-gap) rounded-[0.625rem] p-0 data-selected:outline-2 data-selected:outline-offset-4 data-selected:outline-ring",
        kind === "file" && "mx-0 max-w-md", isHtml && "max-w-none")}
      // check-ui: allow-style 사진 · 동영상의 너비는 블록마다 고른 값이다.
      style={kind === "image" || kind === "video" ? { width: `${width}%` } : undefined}>
      {kind === "file" ? (
        <div className={cn("relative flex items-center gap-3 border bg-card px-3 py-2.5 transition-colors hover:bg-row-hover", isHtml ? "rounded-t-xl" : "rounded-xl")}>
          <div aria-hidden className={cn("flex h-12 w-11 flex-none flex-col items-center justify-center gap-px rounded-[0.5625rem] [&_svg]:size-4.5", FILE_TONE_CLASS[file.tone])}>
            <FileTextIcon /><span className="text-[0.5625rem] leading-none font-bold tracking-wider">{file.label}</span>
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate text-sm font-semibold">{name}</span>
            <span className="text-xs text-muted-foreground">{[file.name, bytes(size)].filter(Boolean).join(" · ")}</span>
          </div>
          {tools}
        </div>
      ) : (
        <div ref={stage} data-state={state} data-ratio={ratio ? "" : undefined}
          className={cn("relative mx-auto overflow-hidden rounded-[0.625rem]", kind === "image" && "w-fit max-w-full", kind === "audio" && "overflow-visible")}
          // check-ui: allow-style 원본 비율과 대표색은 사진마다 다르다.
          style={box}>
          {safe && kind === "image" ? <img ref={picture} key={src} src={src} alt={name} loading="lazy" data-zoomable={!isEditable ? "" : undefined}
            className={cn("block size-full max-h-[32rem] rounded-[0.625rem] object-contain data-zoomable:cursor-zoom-in", !ratio && "w-auto max-w-full",
              color && !atHand && "animate-in fade-in duration-300 motion-reduce:animate-none")}
            // 읽기 화면에서 누르면 크게 보기로 연다(편집 중에는 누르기가 선택이라 두지 않는다).
            onClick={isEditable ? undefined : zoom} onLoad={() => { arrived.add(src); setState("ready") }} onError={() => setState("error")} /> : null}
          {safe && kind === "video" ? <video key={src} src={src} controls preload="metadata" aria-label={name} className="block max-h-[32rem] w-full rounded-[0.625rem] bg-foreground"
            onLoadedMetadata={() => setState("ready")} onError={() => setState("error")}
            onWaiting={() => setState(previous => previous === "error" ? previous : "loading")} onCanPlay={() => setState("ready")} /> : null}
          {safe && kind === "audio" ? <audio key={src} src={src} controls preload="metadata" aria-label={name} className="block w-full"
            onLoadedMetadata={() => setState("ready")} onError={() => setState("error")} /> : null}
          {status}
          {kind === "audio" ? <div className="mt-1.5 flex justify-end">{tools}</div> : tools}
        </div>
      )}
      {isHtml && safe && state !== "error" ? <iframe src={src} title={`${name} 미리보기`} sandbox={HTML_SANDBOX} referrerPolicy="no-referrer" loading="lazy"
        className="block h-104 min-h-40 w-full resize-y rounded-b-xl border border-t-0 bg-white [color-scheme:light] print:hidden" /> : null}
      {kind === "file" ? status : null}
    </NodeViewWrapper>
  )
}

export const MediaNodeView = Media.extend({ addNodeView() { return ReactNodeViewRenderer(MediaView) } })
