import { useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';

const WIDTH_KEY = 'cowork.print-settings-width';
const MIN = 320, MAX = 720, DEFAULT = 400, STEP = 16;
const clamp = (width: number) => Math.round(Math.min(MAX, Math.max(MIN, width)));

function savedWidth() {
  try { return clamp(Number(localStorage.getItem(WIDTH_KEY)) || DEFAULT); } catch { return DEFAULT; }
}
function keepWidth(width: number) {
  try { localStorage.setItem(WIDTH_KEY, String(width)); } catch { /* 저장할 수 없으면 이 화면에서만 쓴다. */ }
}

/**
 * PDF 미리보기의 페이지 설정 칸: 화면 오른쪽에 위아래 끝까지 붙고, 왼쪽 가장자리 손잡이를 끌어(또는 방향키로) 폭을 바꾼다.
 * 고른 폭은 이 브라우저에 기억한다. 손잡이가 칸의 왼쪽에 있어 끄는 방향이 키트 PaneResizeHandle과 반대라 따로 둔다.
 */
export function SettingsDock({ children }: { children: ReactNode }) {
  const [width, setWidth] = useState(savedWidth);
  const resize = (next: number) => { const value = clamp(next); setWidth(value); keepWidth(value); };
  const drag = (event: PointerEvent<HTMLElement>) => {
    event.preventDefault();
    const handle = event.currentTarget, startX = event.clientX, start = width;
    handle.setPointerCapture(event.pointerId);
    const move = (moved: globalThis.PointerEvent) => setWidth(clamp(start + startX - moved.clientX));
    const end = (ended: globalThis.PointerEvent) => {
      keepWidth(clamp(start + startX - ended.clientX));
      handle.removeEventListener('pointermove', move);
      handle.removeEventListener('pointerup', end);
      handle.removeEventListener('pointercancel', end);
    };
    handle.addEventListener('pointermove', move);
    handle.addEventListener('pointerup', end);
    handle.addEventListener('pointercancel', end);
  };
  const keys = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); resize(width + STEP); }
    if (event.key === 'ArrowRight') { event.preventDefault(); resize(width - STEP); }
  };
  // check-ui: allow-style 칸 폭은 사용자가 끌어 정한 값이다.
  const dockWidth = { '--dock-width': `${width / 16}rem` } as CSSProperties;
  return <div style={dockWidth} className="fixed inset-y-0 right-0 z-40 flex w-(--dock-width) max-w-screen items-stretch bg-background shadow-lg print:hidden">
    <div role="separator" aria-orientation="vertical" aria-label="설정 칸 폭" aria-valuemin={MIN} aria-valuemax={MAX} aria-valuenow={width} tabIndex={0}
      onPointerDown={drag} onKeyDown={keys}
      className="z-1 -mr-0.75 w-1.5 flex-none cursor-col-resize touch-none border-l-2 border-transparent outline-none hover:border-ring focus-visible:border-ring active:border-ring" />
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
  </div>;
}
