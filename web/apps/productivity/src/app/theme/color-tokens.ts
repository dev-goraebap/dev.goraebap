import type { ColorTheme } from '@/shared/lib/appearance';
import { colorThemePalettes, paletteRoles } from './boot';

/**
 * The base colours of the shadcn tokens (app/theme/tailwind.css) in the colour theme the member chose (화면 설정), from the
 * same palette roles the Astryx theme reads (boot.ts paletteRoles). Only the base colours change: the greys, borders and
 * the focus ring are mixed from them in tailwind.css. Stone is the stylesheet's own.
 */
const tokenNames = ['--background', '--sidebar', '--muted', '--foreground', '--muted-foreground', '--icon-muted',
  '--primary', '--primary-foreground', '--sidebar-primary-foreground'] as const;

function shadcnColorTokens(color: ColorTheme, dark: boolean): Partial<Record<(typeof tokenNames)[number], string>> {
  const palette = colorThemePalettes.find(([id]) => id === color);
  if (!palette) return {};
  const role = paletteRoles(palette, dark);
  return {
    '--background': role.surface, '--sidebar': role.body, '--muted': role.muted,
    '--foreground': role.ink, '--muted-foreground': role.secondary, '--icon-muted': role.secondary,
    '--primary': role.accent, '--primary-foreground': role.onAccent, '--sidebar-primary-foreground': role.onAccent,
  };
}

/**
 * Each colour theme's swatch in 화면 설정, a gradient of its own colours (--cowork-theme-<id>-preview, read by pages/account/display's
 * DisplayPage), from the same palettes.
 */
const previews: [string, string][] = [['--cowork-theme-stone-preview', 'linear-gradient(135deg, #f9f9fa, #a0a0a5)'],
  ...colorThemePalettes.map(([id, light, body, , , accent]): [string, string] => [`--cowork-theme-${id}-preview`, `linear-gradient(135deg, ${light}, ${body} 60%, ${accent})`])];

/** Puts the mode on html (data-theme, for the tokens' dark block and Tailwind's dark: variant) and the theme's base colours. */
export function applyColorTokens(color: ColorTheme, dark: boolean) {
  const root = document.documentElement;
  root.dataset.theme = dark ? 'dark' : 'light';
  for (const [name, value] of previews) root.style.setProperty(name, value);
  const tokens = shadcnColorTokens(color, dark);
  for (const name of tokenNames) {
    const value = tokens[name];
    if (value) root.style.setProperty(name, value);
    else root.style.removeProperty(name);
  }
}
