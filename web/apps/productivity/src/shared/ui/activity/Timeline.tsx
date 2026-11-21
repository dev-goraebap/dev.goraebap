import type { ReactNode } from 'react';

/** A history on one rule (활동's, and 연결된 코드 on the same rule and rhythm): its entries are TimelineItems. */
export function Timeline({ label, children }: { label: string; children: ReactNode }) {
  return <ol aria-label={label} className="m-0 flex list-none flex-col p-0">{children}</ol>;
}
