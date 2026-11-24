---
arc42: "4, 7"
---

# 오픈소스를 감싸 도입하기

기능이나 가볍지 않은 UI 컴포넌트는 검증된 오픈소스를 먼저 검토하고, 고른 라이브러리는 정확한 버전으로 고정해 프로젝트의 공통 컴포넌트 뒤에 감싸며 무거우면 지연 로딩합니다. 규칙은 [오픈소스 도입](../references/open-source.md)에 있습니다.

## react

출처: [web/package.json](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/package.json)

```json
    "yet-another-react-lightbox": "3.33.0"
```

cowork는 이미지·도표 크게 보기를 직접 만들지 않고 yet-another-react-lightbox를 들였습니다. PhotoSwipe·react-zoom-pan-pinch·lightGallery와 비교해 MIT 라이선스, React 19 지원, 확대 플러그인, SVG 도표를 웹 글꼴 그대로 넣는 사용자 정의 슬라이드를 보고 골랐고, 범위 기호 없이 버전을 고정합니다.

출처: [web/src/shared/ui/zoom-viewer/index.ts](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/src/shared/ui/zoom-viewer/index.ts)

```ts
export { ZoomViewerHost } from './ZoomViewerHost';
export { diagramSlide, openHtml, openZoom, type DiagramSlide, type HtmlPage, type ZoomSlide } from './store';
```

출처: [web/src/shared/ui/zoom-viewer/ZoomViewerHost.tsx](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/src/shared/ui/zoom-viewer/ZoomViewerHost.tsx)

```tsx
import { lazy, Suspense, useSyncExternalStore } from 'react';
import { closeHtml, closeZoom, htmlPage, subscribeZoom, zoomSlide } from './store';

// 창 코드와 라이브러리는 처음 열 때 받는다.
const ZoomViewer = lazy(() => import('./ZoomViewer'));
const HtmlViewer = lazy(() => import('./HtmlViewer'));

/** 앱에 한 번 둔다. openZoom으로 연 이미지·도표와 openHtml로 연 HTML 파일을 크게 보기 창에 띄운다. */
export function ZoomViewerHost() {
  const slide = useSyncExternalStore(subscribeZoom, zoomSlide, () => null);
  const page = useSyncExternalStore(subscribeZoom, htmlPage, () => null);
  return <Suspense fallback={null}>
    {slide && <ZoomViewer slide={slide} onClose={closeZoom} />}
    {page && <HtmlViewer key={page.src} page={page} onClose={closeHtml} />}
  </Suspense>;
}
```

출처: [web/src/shared/ui/zoom-viewer/ZoomViewer.tsx](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/src/shared/ui/zoom-viewer/ZoomViewer.tsx)

```tsx
import { useLayoutEffect, useRef, type CSSProperties } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';
import 'yet-another-react-lightbox/styles.css';
import type { DiagramSlide, ZoomSlide } from './store';
// …
/**
 * 이미지와 도표를 크게 보는 창(yet-another-react-lightbox + Zoom). 휠·두 손가락·두 번 눌러 확대, 끌어서 이동, Esc와 바깥
 * 누르기로 닫기, 초점 가두기를 라이브러리가 맡는다. 한 장만 보이므로 이전·다음 단추는 없앤다. 막은 거의 검은 반투명이다.
 */
export default function ZoomViewer({ slide, onClose }: { slide: ZoomSlide; onClose: () => void }) {
  return <Lightbox open close={onClose} slides={[slide]} plugins={[Zoom]} carousel={{ finite: true }}
    controller={{ closeOnBackdropClick: true }}
    zoom={{ supports: ['diagram'], maxZoomPixelRatio: 4, maxZoom: 6, scrollToZoom: true }}
    labels={{ Close: '닫기', 'Zoom in': '확대', 'Zoom out': '축소', Lightbox: '크게 보기', Carousel: '크게 보기', Slide: '보기', 'Photo gallery': '크게 보기', '{index} of {total}': '{index} / {total}' }}
    render={{ buttonPrev: () => null, buttonNext: () => null,
      slide: ({ slide: shown, rect }) => shown.type === 'diagram' ? <DiagramView slide={shown as DiagramSlide} rect={rect} /> : undefined }}
    styles={{ root: { '--yarl__color_backdrop': 'color-mix(in srgb, black 88%, transparent)' } }} />;
}
```

라이브러리를 가져오는 코드는 제품 공용 컴포넌트 `shared/ui/zoom-viewer` 폴더 안에만 있고, 공개 진입점은 `openZoom`·`openHtml` 같은 함수와 `ZoomViewerHost`만 내보냅니다. `ZoomViewerHost`가 창 코드와 라이브러리를 처음 열 때 지연 로딩합니다.

출처: [web/src/shared/lib/rich-document/RichView.tsx](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/src/shared/lib/rich-document/RichView.tsx)

```tsx
 // 도표를 크게 보기 창으로 연다(지금 화면 색표의 바탕을 깐 채로).
 const zoom=()=>{const svg=previewBox.current?.querySelector('svg');const scheme=getComputedStyle(document.documentElement).colorScheme.includes('dark')?'dark':'light';const slide=diagramSlide(svg,diagramBackground(scheme),`${label} 크게 보기`);if(slide)openZoom(slide);};
```

본문 편집기의 도표 칸은 라이브러리를 모른 채 `diagramSlide`와 `openZoom`만 부릅니다. 라이브러리를 바꿀 때는 `zoom-viewer` 폴더만 고칩니다.
