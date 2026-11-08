/** 테마·첫 화면·브라우저 주변 영역이 함께 쓰는 기준 색 [라이트, 다크]. */
export const themeColors = {
  body: ['#efeff0', '#09090a'],
  surface: ['#f9f9fa', '#121213'],
  secondary: ['#5c5c5e', '#8a8f98'],
} as const satisfies Record<'body' | 'surface' | 'secondary', readonly [string, string]>;
