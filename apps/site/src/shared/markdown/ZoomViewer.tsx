import Lightbox, { type Slide } from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import 'yet-another-react-lightbox/styles.css';
import styles from './zoom-viewer.module.css';

/** 크게 볼 도표: 그린 SVG 그대로(웹 글꼴과 색표 유지), 원래 크기와 함께. */
export type DiagramSlide = { type: 'diagram'; svg: string; width: number; height: number; label: string; background: string };
declare module 'yet-another-react-lightbox' {
  interface SlideTypes { diagram: DiagramSlide }
}
export type ViewerSlide = Slide | DiagramSlide;

/** 도표를 창 안에 맞춘 크기로 그린다. 확대·이동은 Zoom 플러그인이 이 상자 전체에 건다. */
function DiagramView({ slide, rect }: { slide: DiagramSlide; rect: { width: number; height: number } }) {
  // 카드 안쪽 여백(양쪽 1.5rem)을 빼고 맞춘다.
  const scale = Math.min((rect.width - 48) / slide.width, (rect.height - 48) / slide.height);
  return <div className={styles.diagram} role="img" aria-label={slide.label}
    style={{ width: slide.width * scale, height: slide.height * scale, background: slide.background }}
    dangerouslySetInnerHTML={{ __html: slide.svg }} />;
}

/**
 * 이미지와 도표를 크게 보는 창(yet-another-react-lightbox + Zoom). 휠·두 손가락·두 번 눌러 확대, 끌어서 이동, Esc와 바깥
 * 누르기로 닫기, 초점 가두기를 라이브러리가 맡는다. 한 장만 보이므로 이전·다음 단추는 없앤다.
 */
export default function ZoomViewer({ slide, onClose }: { slide: ViewerSlide; onClose: () => void }) {
  return <Lightbox open close={onClose} slides={[slide as Slide]} plugins={[Zoom]} carousel={{ finite: true }}
    controller={{ closeOnBackdropClick: true }}
    zoom={{ supports: ['diagram'], maxZoomPixelRatio: 4, maxZoom: 6, scrollToZoom: true }}
    labels={{ Close: '닫기', 'Zoom in': '확대', 'Zoom out': '축소', Lightbox: '크게 보기', Carousel: '크게 보기', Slide: '보기', 'Photo gallery': '크게 보기', '{index} of {total}': '{index} / {total}' }}
    render={{ buttonPrev: () => null, buttonNext: () => null,
      slide: ({ slide: current, rect }) => current.type === 'diagram' ? <DiagramView slide={current as DiagramSlide} rect={rect} /> : undefined }}
    className={styles.viewer} />;
}
