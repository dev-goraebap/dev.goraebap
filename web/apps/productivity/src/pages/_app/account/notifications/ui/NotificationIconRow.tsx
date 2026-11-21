import type { ReactNode } from 'react';

/** A row with its icon at the start: the name and lines in the middle, its control at the end. */
export function NotificationIconRow({ icon, label, description, children }: { icon: ReactNode; label: string; description?: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex min-h-11 items-center gap-3 p-3 [&>svg]:shrink-0 [&>svg]:text-icon-muted">
      {icon}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="font-medium">{label}</span>
        {description ? <div className="flex flex-col gap-0.5 text-sm text-muted-foreground">{description}</div> : null}
      </div>
      {children ? <div className="flex shrink-0 items-center gap-1">{children}</div> : null}
    </div>
  );
}
