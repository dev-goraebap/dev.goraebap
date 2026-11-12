import { createContext, useContext, useLayoutEffect, useState, type ReactNode } from 'react';
import { SHELL_LAYOUT_KEY, THEME_KEY } from '@/shared/config/preferences';
import type { ShellLayout } from '@/shared/ui/app-shell';

/**
 * 사이트의 화면 설정: 모드(라이트 · 다크)와 셸 배치(Inset · Split). 이 브라우저에만 남는다.
 * 키트의 lib/appearance(키 'appearance', 시스템 모드 · 목록 높이)는 쓰지 않고 이것 하나가 html의 data-theme을 정한다.
 * 첫 방문 덮개와 견본 iframe이 'guide-theme'의 글자 값을 읽고, 이미 고른 방문자의 설정도 이 키에 있기 때문이다.
 * 셸 배치는 html의 data-shell-layout에도 두어 견본 iframe이 바깥 문서에서 읽는다(samples/catalog/shell-layout).
 */
type Mode = 'light' | 'dark';
type Preferences = { mode: Mode; setMode: (mode: Mode) => void; layout: ShellLayout; setLayout: (layout: ShellLayout) => void };
const Context = createContext<Preferences | null>(null);

function readMode(): Mode {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch { /* 저장소를 쓸 수 없으면 시스템 설정을 따른다. */ }
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function readLayout(): ShellLayout {
  try { if (localStorage.getItem(SHELL_LAYOUT_KEY) === 'split') return 'split'; } catch { /* 기본 배치 */ }
  return 'inset';
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>(readMode);
  const [layout, setLayout] = useState<ShellLayout>(readLayout);
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = mode;
    root.style.colorScheme = mode;
    // 덮개 스크립트가 첫 그림 전에 칠한 바탕은 걷는다. 이후 바탕은 토큰(body의 bg-background)이 정한다.
    root.style.removeProperty('background-color');
    try { localStorage.setItem(THEME_KEY, mode); } catch { /* 이번 화면에만 반영한다. */ }
  }, [mode]);
  useLayoutEffect(() => {
    document.documentElement.dataset.shellLayout = layout;
    try { localStorage.setItem(SHELL_LAYOUT_KEY, layout); } catch { /* 이번 화면에만 반영한다. */ }
  }, [layout]);
  return <Context value={{ mode, setMode, layout, setLayout }}>{children}</Context>;
}

export function usePreferences() {
  const value = useContext(Context);
  if (!value) throw new Error('PreferencesProvider가 필요합니다.');
  return value;
}
