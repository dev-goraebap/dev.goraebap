import type { ReactNode } from 'react';

/** One line in a panel's section: a name over what it says, and a token at its end. */
export function PushPanelRow({ label, description, end }: { label: string; description?: string; end?: ReactNode }) {
  return <div className="flex min-h-11 items-center gap-3 px-3 py-2">
    <div className="flex min-w-0 flex-1 flex-col">
      <span className="font-medium wrap-anywhere">{label}</span>
      {description ? <span className="text-sm whitespace-pre-line text-muted-foreground wrap-anywhere">{description}</span> : null}
    </div>
    {end ? <span className="shrink-0">{end}</span> : null}
  </div>;
}
