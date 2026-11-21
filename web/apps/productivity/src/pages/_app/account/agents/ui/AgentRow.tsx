import type { ReactNode } from 'react';

/** An agent's row in a section: its mark, name and line, and what can be done to it at the end. */
export function AgentRow({ mark, name, description, children }: { mark: ReactNode; name: string; description?: string; children?: ReactNode }) {
  return (
    <div className="flex min-h-11 items-center gap-3 p-3">
      {mark}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-medium">{name}</span>
        {description ? <span className="text-sm text-muted-foreground">{description}</span> : null}
      </span>
      {children ? <span className="flex shrink-0 items-center gap-1">{children}</span> : null}
    </div>
  );
}
