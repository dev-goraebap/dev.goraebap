import { useEffect, useLayoutEffect, type ReactNode } from 'react';
import { useAppearance } from '@/shared/lib/appearance';
import { ZoomViewerHost } from '@/shared/ui/zoom-viewer';
import '../theme/tailwind.css';
import '../styles/index.css';
import { colorSurfaces } from '../theme/boot';
import { applyColorTokens } from '../theme/color-tokens';

/**
 * The one theme every screen is drawn in, in the given colour mode: html's data-theme (light · dark), the colour theme's
 * base colours (color-tokens.ts) and the serif choice (data-font, app/theme/fonts.css), set before paint so no frame
 * shows the other mode.
 */
export function AppTheme({ mode = 'system', children }: { mode?: 'system' | 'light' | 'dark'; children: ReactNode }) {
  const { color, font, serifScope } = useAppearance();
  // 명조를 '전체'로 고르면 온 화면의 글꼴을 바꾼다(app/theme/fonts.css). '본문만'이면 본문이 스스로 명조로 쓴다.
  useEffect(() => {
    if (font === 'serif' && serifScope === 'all') document.documentElement.dataset.font = 'serif';
    else delete document.documentElement.dataset.font;
  }, [font, serifScope]);
  useLayoutEffect(() => {
    const system = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => {
      const dark = mode === 'dark' || (mode === 'system' && system.matches);
      applyColorTokens(color, dark);
      const surfaceColor = colorSurfaces[color][dark ? 1 : 0];
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', surfaceColor);
      document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
      document.documentElement.style.backgroundColor = surfaceColor;
    };
    update();
    system.addEventListener('change', update);
    return () => system.removeEventListener('change', update);
  }, [mode, color]);
  return <>{children}<ZoomViewerHost /></>;
}
