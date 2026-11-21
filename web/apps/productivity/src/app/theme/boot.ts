import type { ColorTheme } from '@/shared/lib/appearance';
/** React가 시작되기 전 로켓과 실제 테마가 같은 바탕을 사용한다. */
export const bootColors: Record<'body' | 'surface' | 'secondary', [string, string]> = {
  body: ['#efeff0', '#09090a'], surface: ['#f9f9fa', '#121213'], secondary: ['#5c5c5e', '#8a8f98'],
};

export const colorSurfaces: Record<ColorTheme, [string, string]> = { stone: ['#f9f9fa', '#121213'],
'apricot': ['#fbf8f1', '#25201c'],
'sprout': ['#f8faf6', '#1b2720'],
'cotton-candy': ['#fdf9fa', '#2c2027'],
'dawn-mist': ['#f7f9fb', '#202532'],
'night-sea': ['#f3f7fc', '#1b2331'],
'campfire': ['#fcf7f0', '#25201c'],
};

/**
 * One mode's colours of a colour theme, by role. The one place a palette row becomes colours: the Astryx theme (colors.ts)
 * and the shadcn tokens (color-tokens.ts) both read it, so the two UIs show the same colour while they run together.
 */
export type PaletteRoles = Record<'surface' | 'body' | 'muted' | 'ink' | 'secondary' | 'accent' | 'onAccent', string>;
export function paletteRoles(palette: (typeof colorThemePalettes)[number], dark: boolean): PaletteRoles {
  const [, light, lightBody, lightInk, lightSecondary, lightAccent, darkSurface, darkBody, darkInk, darkSecondary, darkAccent] = palette;
  return dark
    ? { surface: darkSurface, body: darkBody, muted: `color-mix(in srgb, ${darkSurface} 80%, ${darkAccent})`, ink: darkInk, secondary: darkSecondary, accent: darkAccent, onAccent: darkBody }
    : { surface: light, body: lightBody, muted: `color-mix(in srgb, ${light} 60%, ${lightBody})`, ink: lightInk, secondary: lightSecondary, accent: lightAccent, onAccent: light };
}

export const colorThemePalettes = [['apricot', '#fbf8f1', '#efe7d6', '#3a3328', '#7a6f5d', '#946337', '#25201c', '#1d1815', '#e6dccd', '#b5a58c', '#d99a4e'], ['sprout', '#f8faf6', '#e3ebdd', '#2c3a2f', '#66756a', '#4f7d5c', '#1b2720', '#131d17', '#d9e6dc', '#9baa9e', '#8fbc97'], ['cotton-candy', '#fdf9fa', '#f1e3e8', '#3d3236', '#7d6c72', '#a7546d', '#2c2027', '#20171c', '#eddae3', '#b6a0ac', '#e2a0bb'], ['dawn-mist', '#f7f9fb', '#e2e7ee', '#2b3442', '#667184', '#4a6a96', '#202532', '#171c26', '#dce0ef', '#a2adc4', '#9daee0'], ['night-sea', '#f3f7fc', '#dfe7f1', '#26374e', '#5e718b', '#426d9f', '#1b2331', '#141b26', '#d9dfe8', '#a5b1c3', '#7aa2d6'], ['campfire', '#fcf7f0', '#eee1d3', '#413329', '#786650', '#98632b', '#25201c', '#1d1815', '#e6dccd', '#b9aa97', '#d99a4e']] as const;
