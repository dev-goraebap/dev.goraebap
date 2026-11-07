import { useMediaQuery } from '@astryxdesign/core/hooks';

/**
 * 휴대폰과 데스크톱을 가르는 하나의 분기점. 사이드바↔하단 탭, 팝오버↔바텀시트, 다이얼로그↔페이지, 표↔행 목록이
 * 모두 여기서 함께 바뀐다. Astryx 기본 md(768px)를 쓰면 768~1024px에서 사이드바와 하단 탭이 함께 보인다.
 * CSS에서도 같은 값 `(width < 64rem)`만 쓴다.
 */
export const PHONE_QUERY = '(width < 64rem)';

export function useIsPhone() {
  return useMediaQuery(PHONE_QUERY);
}

/** 툴바 알약과 둥근 도구의 크기: 데스크톱 md(28px), 휴대폰 sm(32px; md는 40px라 줄이 붐빈다). */
export function useToolSize(): 'sm' | 'md' {
  return useIsPhone() ? 'sm' : 'md';
}
