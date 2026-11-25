import type { ReactNode } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@goraebap/ui-react/compact/tooltip';

/**
 * A name's tooltip beside what it names (a person's picture in a row). Base UI builds the tooltip's content only when it
 * opens, so a list of tens of rows carries no hidden tooltip per row; the name kept for the call sites that ask for it.
 */
export function LazyTooltip({ content, children }: { content: ReactNode; children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger render={<span className="inline-flex" />}>{children}</TooltipTrigger>
      <TooltipContent>{content}</TooltipContent>
    </Tooltip>
  );
}
