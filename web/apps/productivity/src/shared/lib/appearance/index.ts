import { useSyncExternalStore } from 'react';

/** The colour mode: the device's, or light or dark. */
export const MODES = ['system', 'light', 'dark'] as const;
export type Mode = typeof MODES[number];
/** A desktop's layout: inset (the page a card on the wash) or split (the page ruled off from the menu). */
export const LAYOUTS = ['inset', 'split'] as const;
export type Layout = typeof LAYOUTS[number];
/** How tall a page's rows are: comfortable (the usual) or compact, for every list and table at once. */
export const DENSITIES = ['comfortable', 'compact'] as const;
export type Density = typeof DENSITIES[number];
export const COLOR_THEMES = [{ id: 'stone', label: '스톤' }, { id: 'apricot', label: '살구' }, { id: 'sprout', label: '새싹' }, { id: 'cotton-candy', label: '솜사탕' }, { id: 'dawn-mist', label: '새벽안개' }, { id: 'night-sea', label: '밤바다' }, { id: 'campfire', label: '모닥불' }] as const;
export type ColorTheme = typeof COLOR_THEMES[number]['id'];
/** The typeface: the usual gothic (Pretendard) or a serif (Maru Buri). */
export const FONTS = ['gothic', 'serif'] as const;
export type Font = typeof FONTS[number];
/** Where the serif goes when chosen: only a body being read or written (a rich body, a Markdown body), or every screen. */
export const SERIF_SCOPES = ['body', 'all'] as const;
export type SerifScope = typeof SERIF_SCOPES[number];
/** How a body's diagrams (Mermaid) are drawn, as Linear's Diagram style: default, a terminal's (tui), hairline, hand-drawn. */
export const DIAGRAM_STYLES = [{ id: 'default', label: '기본' }, { id: 'tui', label: 'TUI' }, { id: 'hairline', label: '가는 선' }, { id: 'handDrawn', label: '손그림' }] as const;
export type DiagramStyle = typeof DIAGRAM_STYLES[number]['id'];
export type Appearance = { mode: Mode; color: ColorTheme; layout: Layout; density: Density; font: Font; serifScope: SerifScope; diagram: DiagramStyle };

// Preserve the original browser key, including colour choices made in the previous client.
const KEY = 'cowork-appearance';
const FALLBACK: Appearance = { mode: 'system', color: 'stone', layout: 'inset', density: 'comfortable', font: 'gothic', serifScope: 'body', diagram: 'default' };
/** The font a body's own menu kept before the typeface moved here (2026-11-10): its serif carries over, for bodies only. */
function legacyFont(): Font {
  try { return window.localStorage.getItem('cowork-body-font') === 'serif' ? 'serif' : FALLBACK.font; } catch { return FALLBACK.font; }
}
const listeners = new Set<() => void>();

function stored(): Record<string, unknown> {
  try { return JSON.parse(window.localStorage.getItem(KEY) ?? 'null') ?? {}; } catch { return {}; }
}
function read(): Appearance {
  const value = stored();
  return {
    color: COLOR_THEMES.some(theme => theme.id === value.color) ? value.color as ColorTheme : FALLBACK.color,
    mode: MODES.includes(value.mode as Mode) ? value.mode as Mode : FALLBACK.mode,
    layout: LAYOUTS.includes(value.layout as Layout) ? value.layout as Layout : FALLBACK.layout,
    density: DENSITIES.includes(value.density as Density) ? value.density as Density : FALLBACK.density,
    font: FONTS.includes(value.font as Font) ? value.font as Font : legacyFont(),
    serifScope: SERIF_SCOPES.includes(value.serifScope as SerifScope) ? value.serifScope as SerifScope : FALLBACK.serifScope,
    diagram: DIAGRAM_STYLES.some(style => style.id === value.diagram) ? value.diagram as DiagramStyle : FALLBACK.diagram,
  };
}

let current = read();

/** Changes the look at once, kept in this browser (an appearance is the browser's, never the server's). */
export function setAppearance(next: Partial<Appearance>) {
  current = { ...current, ...next };
  // Storage can be unavailable (private mode, blocked); the choice then lasts for this page only.
  try { window.localStorage.setItem(KEY, JSON.stringify({ ...stored(), ...current })); } catch { /* keep it in memory */ }
  listeners.forEach(listener => listener());
}

// Another tab changing it changes this one too.
window.addEventListener('storage', event => {
  if (event.key === KEY || event.key === null) { current = read(); listeners.forEach(listener => listener()); }
});
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };

/** The look in force, following every change. */
export const useAppearance = () => useSyncExternalStore(subscribe, () => current);
/** Whether a body (a rich body, a Markdown body) is set in the serif: whenever the serif is chosen, whatever its scope. */
export const useSerifBody = () => useAppearance().font === 'serif';
