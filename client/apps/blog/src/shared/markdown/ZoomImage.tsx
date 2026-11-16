import { lazy, Suspense, useState, type ComponentPropsWithRef } from 'react';
import type { ViewerSlide } from './ZoomViewer';

const ZoomViewer = lazy(() => import('./ZoomViewer'));

/** 본문 이미지: 누르면 크게 보기 창에서 원래 크기까지 확대해 본다. 받은 이미지의 실제 크기로 확대 한도를 정한다. */
export function ZoomImage({ alt = '', ...props }: ComponentPropsWithRef<'img'>) {
  const [slide, setSlide] = useState<ViewerSlide | null>(null);
  return <>
    {/* 모양은 이미지 그대로, 누르면 크게 보기. */}
    <button type="button" className="mx-auto block w-fit max-w-full cursor-zoom-in rounded-lg p-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2" aria-label={`${alt || '이미지'} 크게 보기`}
      onClick={event => {
        const image = event.currentTarget.querySelector('img');
        if (!image?.currentSrc && !props.src) return;
        setSlide({ src: image?.currentSrc || String(props.src), alt, width: image?.naturalWidth || undefined, height: image?.naturalHeight || undefined });
      }}>
      <img alt={alt} {...props} />
    </button>
    {slide ? <Suspense fallback={null}><ZoomViewer slide={slide} onClose={() => setSlide(null)} /></Suspense> : null}
  </>;
}
