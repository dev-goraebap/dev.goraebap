import { useLayoutEffect, useRef } from "react"
import Lightbox from "yet-another-react-lightbox"
import Zoom from "yet-another-react-lightbox/plugins/zoom"
import "yet-another-react-lightbox/styles.css"
import type { DiagramSlide, ZoomSlide } from "./zoom"

/** 카드 안쪽 여백(양쪽)을 뺀 창 안에 도표를 맞춘다. */
const PADDING = 48

/** 도표를 그린 SVG 그대로 넣는다. 확대 · 이동은 Zoom 플러그인이 이 상자 전체에 건다. */
function DiagramView({ slide, rect }: { slide: DiagramSlide; rect: { width: number; height: number } }) {
  const box = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => { if (box.current) box.current.innerHTML = slide.svg }, [slide.svg])
  const scale = Math.min((rect.width - PADDING) / slide.width, (rect.height - PADDING) / slide.height)
  return (
    <div ref={box} role="img" aria-label={slide.label} className="box-content block rounded-xl p-6 [&_svg]:block [&_svg]:size-full [&_svg]:max-w-none"
      // check-ui: allow-style 크기와 바탕색은 도표마다 다르다(도표 원래 크기와 그 색표의 바탕).
      style={{ inlineSize: slide.width * scale, blockSize: slide.height * scale, backgroundColor: slide.background }} />
  )
}

/**
 * 사진과 도표를 크게 보는 창(yet-another-react-lightbox + Zoom). 휠 · 두 손가락 · 두 번 눌러 확대, 끌어서 이동, Esc와 바깥 누르기로
 * 닫기, 초점 가두기를 라이브러리가 맡는다. 한 장만 보이므로 이전 · 다음 단추는 없앤다. 어두운 막 위에 한 장을 둔다.
 */
export default function ZoomViewer({ slide, onClose }: { slide: ZoomSlide; onClose: () => void }) {
  return (
    <Lightbox open close={onClose} slides={[slide]} plugins={[Zoom]} carousel={{ finite: true }} controller={{ closeOnBackdropClick: true }}
      zoom={{ supports: ["diagram"], maxZoomPixelRatio: 4, maxZoom: 6, scrollToZoom: true }}
      labels={{ Close: "닫기", "Zoom in": "확대", "Zoom out": "축소", Lightbox: "크게 보기", Carousel: "크게 보기", Slide: "보기", "Photo gallery": "크게 보기", "{index} of {total}": "{index} / {total}" }}
      render={{ buttonPrev: () => null, buttonNext: () => null,
        slide: ({ slide: shown, rect }) => shown.type === "diagram" ? <DiagramView slide={shown as DiagramSlide} rect={rect} /> : undefined }}
      // 막 색은 라이브러리의 변수로만 바꿀 수 있다(밑줄이 든 이름이라 클래스로 쓰기 어렵다).
      styles={{ root: { "--yarl__color_backdrop": "color-mix(in srgb, black 88%, transparent)" } as Record<string, string> }} />
  )
}
