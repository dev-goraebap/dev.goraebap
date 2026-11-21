/**
 * 첫 방문 덮개의 중립 기본 그림(앱 창 하나). 제품은 자기 표시로 바꾼다.
 * 선 · 점은 rgb(0,0,0), 면은 rgb(254,254,255)로 그린다: 덮개가 이 두 값을 보조 잉크와 올린 면 색으로 바꾼다.
 */
export const BOOT_MARK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" fill="none" aria-hidden="true">
  <rect x="28" y="38" width="104" height="84" rx="12" fill="rgb(254,254,255)" stroke="rgb(0,0,0)" stroke-width="3" />
  <path d="M28 58h104" stroke="rgb(0,0,0)" stroke-width="3" />
  <circle cx="42" cy="48" r="3" fill="rgb(0,0,0)" />
  <circle cx="52" cy="48" r="3" fill="rgb(0,0,0)" />
  <path d="M46 76h44M46 90h68M46 104h36" stroke="rgb(0,0,0)" stroke-width="3" stroke-linecap="round" />
</svg>`

/** 그림의 두 약속 색을 토큰으로 바꾼다. 잉크는 currentColor(덮개의 글자색), 면은 올린 면(--card). */
export const tintBootMark = (svg: string, surface = "var(--card)") =>
  svg.replaceAll("rgb(0,0,0)", "currentColor").replaceAll("rgb(254,254,255)", surface)
