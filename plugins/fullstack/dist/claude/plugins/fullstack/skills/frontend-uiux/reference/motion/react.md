# 움직임 (react)

공통 규칙은 [index.md](index.md)에 있습니다.

## crossfade

페이지 이동의 교차 페이드 이름 `cowork-content`는 `.route-content`에만 붙고, 문서 루트의 기본 스냅숏은 `view-transition-name: none`으로 뺍니다. 동작 줄이기 설정에서는 교차 페이드를 끕니다.

출처: [web/src/app/styles/index.css](https://github.com/dev-goraebap/cowork/blob/570d27da402451fe2ca06fca74862dd3899555c9/web/src/app/styles/index.css)

```css
/* Only the page content is captured. The shell and native dialogs stay live. */
:root { view-transition-name: none; }
::view-transition { pointer-events: none; }
::view-transition-group(cowork-content) { animation-duration: 200ms; animation-timing-function: ease-in-out; }
::view-transition-image-pair(cowork-content) { isolation: isolate; }
::view-transition-old(cowork-content) { animation: cowork-content-out 200ms ease-in-out both; mix-blend-mode: plus-lighter; }
::view-transition-new(cowork-content) { animation: cowork-content-in 200ms ease-in-out both; mix-blend-mode: plus-lighter; }
@keyframes cowork-content-out { from { opacity: 1; } to { opacity: 0; } }
@keyframes cowork-content-in { from { opacity: 0; } to { opacity: 1; } }
/* … */
@media (prefers-reduced-motion: reduce) {
  ::view-transition-group(cowork-content), ::view-transition-old(cowork-content), ::view-transition-new(cowork-content) { animation: none; }
}
/* … */
.route-content { view-transition-name: cowork-content; }
```
