/**
 * 첫 방문 덮개의 색 [라이트, 다크]. 앱 CSS가 오기 전에 쓰므로 테마(foundations/theme.ts)의 기준 색 값을 그대로 적는다.
 * 테마의 기준 색을 바꾸면 여기도 바꾼다. 같은지는 검사(boot-colors.test.ts)가 확인한다.
 */
export const bootColors = {
  body: ['#efeff0', '#09090a'],
  surface: ['#f9f9fa', '#121213'],
  secondary: ['#5c5c5e', '#8a8f98'],
} as const satisfies Record<'body' | 'surface' | 'secondary', readonly [string, string]>;

export const bootColor = (key: keyof typeof bootColors) => `light-dark(${bootColors[key][0]}, ${bootColors[key][1]})`;
