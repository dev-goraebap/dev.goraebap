import { createContext, useContext } from 'react';
import type { ShellLayout } from '@/shared/ui/app-shell';

/** 목록 높이: 여유 있게(spacious) · 촘촘하게(compact). 키트 화면 설정과 같은 이름이며, 이 앱의 감싸개(data-density)가 compact: 변형에 닿는다. */
export type Density = 'spacious' | 'compact';
export type Appearance = { layout: ShellLayout; density: Density; setLayout: (layout: ShellLayout) => void; setDensity: (density: Density) => void };
export const AppearanceContext = createContext<Appearance | null>(null);
export function useAppearance() {
  const appearance = useContext(AppearanceContext);
  if (!appearance) throw new Error('AppearanceContext가 필요합니다.');
  return appearance;
}
