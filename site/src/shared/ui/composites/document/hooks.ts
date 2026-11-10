import { useMediaQuery } from '@astryxdesign/core/hooks';
import { useLayoutEffect, useRef, useState } from 'react';
import { PHONE_QUERY } from '../../foundations/media';

/**
 * 화면이 휴대폰 폭인지(인쇄 중에는 아니다). 인쇄할 때는 종이 폭이 화면 폭이 되어 PHONE_QUERY가 참이 되는데, 그때 페이지 없음으로
 * 다시 그리면 화면에서 나눈 페이지 경계가 사라진다. 문서 부품은 화면(screen)에서만 휴대폰을 가른다.
 */
export function useIsPhoneScreen() {
  return useMediaQuery(`screen and ${PHONE_QUERY}`);
}

/** 종이가 들어갈 칸이 종이보다 좁으면 종이를 줄일 배율. 칸이 넓으면 1이다(키우지 않는다). pageWidth는 기준 글자 16px일 때의 px다. */
export function useFitZoom(pageWidth: number, padding = 48) {
  const ref = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    // 종이 폭은 rem이라 큰 화면에서 기준 글자와 함께 커진다. 실제 화면 폭으로 맞춘다.
    const fit = () => {
      const rem = parseFloat(getComputedStyle(element.ownerDocument.documentElement).fontSize) / 16 || 1;
      setZoom(Math.min(1, Math.max(0.4, (element.clientWidth - padding) / (pageWidth * rem))));
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(element);
    return () => observer.disconnect();
  }, [pageWidth, padding]);
  return { ref, zoom };
}
