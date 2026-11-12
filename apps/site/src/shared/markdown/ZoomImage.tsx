import { lazy, Suspense, useState, type ComponentPropsWithRef } from 'react';
import type { ViewerSlide } from './ZoomViewer';
import styles from './zoom-viewer.module.css';

const ZoomViewer = lazy(() => import('./ZoomViewer'));

/** 본문 이미지: 누르면 크게 보기 창에서 원래 크기까지 확대해 본다. 받은 이미지의 실제 크기로 확대 한도를 정한다. */
export function ZoomImage({ alt = '', ...props }: ComponentPropsWithRef<'img'>) {
  const [slide, setSlide] = useState<ViewerSlide | null>(null);
  return <>
    <button type="button" className={styles.imageButton} aria-label={`${alt || '이미지'} 크게 보기`}
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
