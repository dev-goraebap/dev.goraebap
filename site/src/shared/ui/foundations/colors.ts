/** 테마·첫 화면·브라우저 주변 영역이 함께 쓰는 기준 색 [라이트, 다크]. */
export const themeColors = {
  body: ['#efeff0', '#09090a'],
  surface: ['#f9f9fa', '#121213'],
  secondary: ['#5c5c5e', '#8a8f98'],
} as const satisfies Record<'body' | 'surface' | 'secondary', readonly [string, string]>;

/**
 * 본문 도표(Mermaid)의 색표 [라이트, 다크]. Mermaid는 CSS 변수를 읽지 못해 색 값을 직접 받는다. 파란 회색 면, 진한 글자,
 * 회청색 선이며, Mermaid가 글자·선·메시지 라벨을 기본 글자색으로 그리므로 라이트와 다크를 따로 둔다.
 */
export const diagramColors = {
  light: { darkMode: false, background: '#fafafa', primaryColor: '#edf2f6', primaryTextColor: '#1f2933', primaryBorderColor: '#7d90a1', lineColor: '#5c6d7c', secondaryColor: '#e3e9ee', tertiaryColor: '#f3f5f7' },
  dark: { darkMode: true, background: '#1c1e21', primaryColor: '#242c34', primaryTextColor: '#e0e7ed', primaryBorderColor: '#52697a', lineColor: '#8a9cab', secondaryColor: '#23292e', tertiaryColor: '#202529' },
} as const;
