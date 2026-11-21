import { createElement, useEffect, useMemo, useState, type ComponentType, type SVGProps } from 'react';
import { solarIcon } from '../icons';
import { SOLAR_ICONS } from '../icons/solar-icons';
import { loadedSolar, loadSolar } from './catalog';

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;
const made = new Map<string, IconComponent>();

/** The full set's icon by its Solar name, once the set is fetched; a faint square of the icon's size holds its place meanwhile. */
function lazySolar(name: string): IconComponent {
  const Icon: IconComponent = props => {
    const [all, setAll] = useState(loadedSolar);
    useEffect(() => {
      if (all) return;
      let isLive = true;
      void loadSolar().then(set => { if (isLive) setAll(set); });
      return () => { isLive = false; };
    }, [all]);
    // A name the set does not have (one renamed upstream) draws solarIcon's fallback, the document.
    const body = all ? all[name] ?? SOLAR_ICONS.document![0] : undefined;
    // One body object per body (shared/ui/icon/solar.ts says why).
    const html = useMemo(() => (body ? { __html: body } : undefined), [body]);
    // The same box as solarIcon's, so a picked icon sits where the common ones do.
    const svg = { viewBox: '0 0.9 24 24', width: '1rem', height: '1rem', 'aria-hidden': true, focusable: false, ...props };
    return html ? createElement('svg', { ...svg, dangerouslySetInnerHTML: html })
      : createElement('svg', svg, createElement('rect', { x: 2, y: 2.9, width: 20, height: 20, rx: 4, fill: 'currentColor', opacity: 0.15 }));
  };
  Icon.displayName = `Solar(s:${name})`;
  return Icon;
}

/**
 * A mark's icon as the icon component Astryx takes (IconType), whatever was picked (BIT's MarkIcon): one of the app's own
 * names or a common `s:` one (solarIcon, drawn at once, Bold Duotone when chosen if it has one), or any other Solar icon
 * by `s:` and its name, drawn once the whole set is fetched (Linear only).
 */
export function markIcon(name: string, isChosen = false): IconComponent {
  if (!name.startsWith('s:') || SOLAR_ICONS[name]) return solarIcon(name, isChosen);
  let icon = made.get(name);
  if (!icon) made.set(name, (icon = lazySolar(name.slice(2))));
  return icon;
}
