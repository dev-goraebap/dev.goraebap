import { createContext, useContext } from 'react';
import type { Density } from '@kit/layouts/page/PageParts';
import type { ShellLayout } from '@kit/layouts/app/AppFrame';

export type Appearance = { layout: ShellLayout; density: Density; setLayout: (layout: ShellLayout) => void; setDensity: (density: Density) => void };
export const AppearanceContext = createContext<Appearance | null>(null);
export function useAppearance() {
  const appearance = useContext(AppearanceContext);
  if (!appearance) throw new Error('AppearanceContext가 필요합니다.');
  return appearance;
}
