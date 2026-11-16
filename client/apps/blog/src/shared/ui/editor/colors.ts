/**
 * 본문의 글자색 · 배경색. 본문에는 색 값 대신 변수 이름(var(--editor-ink-*) · var(--editor-fill-*))이 남아 라이트 · 다크에서
 * 각자의 색으로 보인다. 이미 저장된 본문이 이 변수 이름을 쓰므로 이름을 바꾸지 않는다.
 *
 * 변수는 EDITOR_COLOR_VARS를 단 요소 안에서만 뜻이 있다: 에디터 틀과, 색 견본을 그리는 메뉴(포털로 떠서 틀 밖이다)에 단다.
 * 배경색은 테마의 일정 분류 색(--event-*)을 그대로 쓴다. 글자색은 그 색의 색상(hue)만 받아 바탕 위에서 읽히는 밝기 · 채도로
 * 다시 칠한다(분류 색의 글자 짝은 본문 글자와 거의 구분되지 않게 낮춰져 있다). 모드마다 다른 것은 밝기 · 채도 두 값뿐이라
 * 그 둘만 dark:에서 바꾼다. 갈색은 테마에 없어 주황의 색상을 낮은 채도로 쓴다.
 */
export const EDITOR_COLOR_VARS = [
  "[--editor-ink-l:0.52] [--editor-ink-c:1] dark:[--editor-ink-l:0.78] dark:[--editor-ink-c:0.72]",
  "[--editor-ink-gray:oklch(from_var(--event-gray)_var(--editor-ink-l)_0.01_h)]",
  "[--editor-ink-brown:oklch(from_var(--event-orange)_var(--editor-ink-l)_calc(0.06*var(--editor-ink-c))_h)]",
  "[--editor-ink-orange:oklch(from_var(--event-orange)_calc(var(--editor-ink-l)+0.06)_calc(0.14*var(--editor-ink-c))_h)]",
  "[--editor-ink-yellow:oklch(from_var(--event-yellow)_calc(var(--editor-ink-l)+0.06)_calc(0.12*var(--editor-ink-c))_h)]",
  "[--editor-ink-green:oklch(from_var(--event-green)_var(--editor-ink-l)_calc(0.12*var(--editor-ink-c))_h)]",
  "[--editor-ink-blue:oklch(from_var(--event-blue)_var(--editor-ink-l)_calc(0.13*var(--editor-ink-c))_h)]",
  "[--editor-ink-purple:oklch(from_var(--event-purple)_var(--editor-ink-l)_calc(0.13*var(--editor-ink-c))_h)]",
  "[--editor-ink-pink:oklch(from_var(--event-pink)_var(--editor-ink-l)_calc(0.13*var(--editor-ink-c))_h)]",
  "[--editor-ink-red:oklch(from_var(--event-red)_var(--editor-ink-l)_calc(0.15*var(--editor-ink-c))_h)]",
  "[--editor-fill-gray:var(--event-gray)] [--editor-fill-brown:color-mix(in_srgb,var(--event-orange)_55%,var(--event-gray))]",
  "[--editor-fill-orange:var(--event-orange)] [--editor-fill-yellow:var(--event-yellow)] [--editor-fill-green:var(--event-green)]",
  "[--editor-fill-blue:var(--event-blue)] [--editor-fill-purple:var(--event-purple)] [--editor-fill-pink:var(--event-pink)] [--editor-fill-red:var(--event-red)]",
].join(" ")

const NAMES: [label: string, key: string][] = [["회색", "gray"], ["갈색", "brown"], ["주황색", "orange"], ["노란색", "yellow"], ["초록색", "green"],
  ["파란색", "blue"], ["보라색", "purple"], ["분홍색", "pink"], ["빨간색", "red"]]

/** 색 이름과 본문에 남는 값. 빈 값은 기본(색 없음)이다. */
export const COLORS: { name: string; ink: string; fill: string }[] = [
  { name: "기본", ink: "", fill: "" },
  ...NAMES.map(([name, key]) => ({ name, ink: `var(--editor-ink-${key})`, fill: `var(--editor-fill-${key})` })),
]
