import type { ReactNode } from "react";
import { StateLandscape, type StateKind } from "./StateLandscape";

export function PageState({
  kind,
  title,
  description,
  action,
  isCompact = false,
}: {
  kind: StateKind;
  title: string;
  description?: string;
  action?: ReactNode;
  isCompact?: boolean;
}) {
  const Heading = isCompact ? "h2" : "h1";

  return (
    <div
      role="status"
      className={`flex w-full flex-col items-center gap-1 px-4 text-center motion-safe:animate-[page-state-enter_420ms_cubic-bezier(0.2,0,0,1)_both] ${
        isCompact ? "py-4" : "py-16"
      }`}
    >
      <div className="mb-3">
        <StateLandscape kind={kind} isCompact={isCompact} />
      </div>
      <Heading className="text-muted-foreground text-lg font-medium">{title}</Heading>
      {description && (
        <p className="text-muted-foreground/80 max-w-md text-sm break-keep">{description}</p>
      )}
      {action && <div className="mt-3 flex items-center gap-2">{action}</div>}
    </div>
  );
}
