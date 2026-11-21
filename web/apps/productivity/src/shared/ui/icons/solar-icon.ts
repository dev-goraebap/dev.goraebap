import { createElement } from 'react';
import type { Icon } from '@/shared/ui/kit/icon';
import { SOLAR_ICONS } from './solar-icons';

const made = new Map<string, Icon>();

/**
 * A Solar icon by its meaning name (home, inbox, projects …): Linear, or the same icon's Bold Duotone for what is chosen.
 * A name with no Bold Duotone draws Linear. Screens call the kit's icons (@/shared/ui/icon) by name; this stays for the
 * names that are data, kept by the server (a project's, a label's, a view's mark), and for parts not yet moved.
 * It is the kit's Icon, so it also takes `chosen`, which wins over isChosen. 16px by default; a place that wants another
 * size sets it with a class.
 */
export function solarIcon(name: string, isChosen = false): Icon {
  const key = `${name}:${isChosen}`;
  const known = made.get(key);
  if (known) return known;
  const [linear, boldDuotone] = SOLAR_ICONS[name] ?? SOLAR_ICONS.document!;
  // The body objects are made once (shared/ui/icon/solar.ts says why: a new one each render rewrites the svg and loops a toast).
  const plain = { __html: linear };
  const bold = boldDuotone ? { __html: boldDuotone } : plain;
  // children are dropped, as the kit's icons do: a Base UI render hands its default children along.
  const Icon: Icon = ({ chosen = isChosen, children: _children, ...props }) => createElement('svg', {
    viewBox: '0 0 24 24', width: '1rem', height: '1rem', 'aria-hidden': true, focusable: false, ...props,
    dangerouslySetInnerHTML: chosen ? bold : plain,
  });
  Icon.displayName = `Solar(${name})`;
  made.set(key, Icon);
  return Icon;
}
