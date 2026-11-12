import { createContext, lazy, Suspense, useContext } from "react"
import type { Slide } from "yet-another-react-lightbox"
import { Button } from "@/shared/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/shared/ui/dialog"
import type { LinkPreview, ReadLinkPreview } from "./types"

/** 크게 볼 도표: 그린 SVG 그대로(웹 글꼴과 색표 유지), 원래 크기와 바탕색과 함께. */
export type DiagramSlide = { type: "diagram"; svg: string; width: number; height: number; label: string; background: string }
declare module "yet-another-react-lightbox" { interface SlideTypes { diagram: DiagramSlide } }
export type ZoomSlide = Slide | DiagramSlide
/** 크게 볼 HTML 파일: 본문에 넣은 HTML 임베드의 주소와 이름. */
export type HtmlPage = { src: string; title: string }

/**
 * 노드 뷰(사진 · 도표 · 링크 카드)가 에디터 바깥의 것에 닿는 길: 크게 보기 창을 열고, 링크 미리보기를 읽는다. RichEditor가 둔다.
 */
export type EditorHost = { openZoom: (slide: ZoomSlide) => void; openHtml: (page: HtmlPage) => void; readPreview?: ReadLinkPreview }
export const EditorHostContext = createContext<EditorHost>({ openZoom: () => undefined, openHtml: () => undefined })
export const useEditorHost = () => useContext(EditorHostContext)

/** 그린 Mermaid SVG를 크게 보기 슬라이드로: viewBox에서 원래 크기를 읽는다. 크기를 모르면 null. */
export function diagramSlide(svg: SVGSVGElement | null | undefined, background: string, label: string): DiagramSlide | null {
  const [, , width, height] = (svg?.getAttribute("viewBox") ?? "").split(/[ ,]+/).map(Number)
  if (!svg || !width || !height) return null
  // 본문에서 폭에 맞추려고 붙인 크기(style)는 떼어, 창 안에서는 상자를 가득 채우게 한다.
  const copy = svg.cloneNode(true) as SVGSVGElement
  copy.removeAttribute("style")
  return { type: "diagram", svg: copy.outerHTML, width, height, label, background }
}

// 창 코드와 라이브러리는 처음 열 때 받는다.
const ZoomViewer = lazy(() => import("./ZoomViewer"))

/** 에디터마다 하나. 연 사진 · 도표는 크게 보기 창에, HTML 파일은 창을 거의 채우는 대화상자에 띄운다. */
export function ZoomHost({ slide, page, onClose }: { slide: ZoomSlide | null; page: HtmlPage | null; onClose: () => void }) {
  return <>
    {slide ? <Suspense fallback={null}><ZoomViewer slide={slide} onClose={onClose} /></Suspense> : null}
    <HtmlViewer page={page} onClose={onClose} />
  </>
}

/** 올린 HTML을 그리는 격리 틀의 권한: 스크립트 · 대화 · 양식 · 새 창은 되지만 같은 출처 권한이 없어 앱의 화면 · 쿠키 · 저장소에 닿지 못한다. */
export const HTML_SANDBOX = "allow-scripts allow-modals allow-forms allow-popups"

/**
 * 본문에 넣은 HTML 파일을 창 가득 크게 보는 창. 올린 사람의 스크립트가 들어 있을 수 있으므로 본문의 미리보기와 같은 격리된
 * 틀(sandbox) 안에서만 그린다. Esc와 닫기로 닫고, 초점 가두기는 대화상자가 맡는다. 틀의 바탕은 흰색으로 둔다(올린 HTML은
 * 대개 밝은 바탕을 전제로 하고, 바탕을 정하지 않은 문서가 어두운 화면에서 검은 글씨로 묻히지 않게).
 */
function HtmlViewer({ page, onClose }: { page: HtmlPage | null; onClose: () => void }) {
  // 저장 전의 임시 주소(blob:)는 새 탭에서 이 앱의 출처로 열리므로 내놓지 않는다. 서버가 내주는 주소는 서버가 격리 정책을 붙여 준다.
  const canOpenTab = !!page && !page.src.startsWith("blob:")
  return (
    <Dialog open={!!page} onOpenChange={next => { if (!next) onClose() }}>
      <DialogContent showCloseButton={false} aria-label={page ? `${page.title} 크게 보기` : undefined}
        className="flex h-[94dvh] w-[min(96vw,100rem)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:max-w-none">
        <div className="flex flex-none items-center justify-between gap-2 border-b px-3 py-2">
          <DialogTitle className="min-w-0 truncate text-sm font-semibold">{page?.title}</DialogTitle>
          <div className="flex items-center gap-2">
            {canOpenTab ? <Button variant="secondary" size="sm" className="max-md:h-11" onClick={() => window.open(page.src, "_blank", "noopener,noreferrer")}>새 탭에서 열기</Button> : null}
            <Button variant="secondary" size="sm" className="max-md:h-11" onClick={onClose}>닫기</Button>
          </div>
        </div>
        {page ? <iframe src={page.src} title={page.title} sandbox={HTML_SANDBOX} referrerPolicy="no-referrer" className="block min-h-0 w-full flex-1 border-0 bg-white [color-scheme:light]" /> : null}
      </DialogContent>
    </Dialog>
  )
}

// 같은 주소의 카드는 한 번만 묻는다(본문을 다시 그려도, 같은 주소가 여러 번 나와도). 실패한 답은 다음에 다시 묻게 지운다.
const asked = new WeakMap<ReadLinkPreview, Map<string, Promise<LinkPreview>>>()
export function previewOf(read: ReadLinkPreview, url: string) {
  let known = asked.get(read)
  if (!known) { known = new Map(); asked.set(read, known) }
  let found = known.get(url)
  if (!found) { found = read(url); known.set(url, found); found.catch(() => known.delete(url)) }
  return found
}
