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
