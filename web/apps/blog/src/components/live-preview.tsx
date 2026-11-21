import type { ReactNode } from "react";

interface LivePreviewProps {
  title?: string;
  children: ReactNode;
}

export function LivePreview({ title, children }: LivePreviewProps) {
  return (
    <div className="border-border bg-card my-6 overflow-hidden rounded-lg border">
      {title ? (
        <div className="border-border/80 text-muted-foreground border-b px-4 py-2 font-mono text-[11px]">
          {title}
        </div>
      ) : null}
      <div className="bg-dots flex flex-wrap items-center justify-center gap-2 p-6">{children}</div>
    </div>
  );
}
