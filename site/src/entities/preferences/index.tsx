import { createContext, useContext, useLayoutEffect, useState, type ReactNode } from 'react';
import { SHELL_LAYOUT_KEY } from '@/shared/ui/layouts/app/shell-layout-key';
import type { ShellLayout } from '@/shared/ui/layouts/app/AppFrame';
type Mode = 'light' | 'dark';
type Preferences = { mode: Mode; setMode: (mode: Mode) => void; layout: ShellLayout; setLayout: (layout: ShellLayout) => void };
const Context = createContext<Preferences | null>(null);
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<Mode>(() => { try { const saved = localStorage.getItem('guide-theme'); if (saved === 'light' || saved === 'dark') return saved; } catch {} return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; });
  const [layout, setLayout] = useState<ShellLayout>(() => { try { if (localStorage.getItem(SHELL_LAYOUT_KEY) === 'split') return 'split'; } catch {} return 'inset'; });
  useLayoutEffect(() => { document.documentElement.dataset.theme = mode; document.documentElement.style.colorScheme = mode; try { localStorage.setItem('guide-theme', mode); } catch {} }, [mode]);
  useLayoutEffect(() => { document.documentElement.dataset.shellLayout = layout; try { localStorage.setItem(SHELL_LAYOUT_KEY, layout); } catch {} }, [layout]);
  return <Context value={{ mode, setMode, layout, setLayout }}>{children}</Context>;
}
export function usePreferences() { const value = useContext(Context); if (!value) throw new Error('PreferencesProvider가 필요합니다.'); return value; }
