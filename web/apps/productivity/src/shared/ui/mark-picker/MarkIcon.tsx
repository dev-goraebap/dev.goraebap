import { createElement, type SVGProps } from 'react';
import { markIcon } from './mark-icon';

/** A mark's icon as an element (markIcon), sized by its parent's rules like any icon. */
export function MarkIcon({ name, isChosen = false, ...props }: { name: string; isChosen?: boolean } & SVGProps<SVGSVGElement>) {
  return createElement(markIcon(name, isChosen), props);
}
