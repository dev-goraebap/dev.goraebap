import type { ReactNode } from 'react';

/** 속성 한 줄(Linear의 프로젝트 속성): 왼쪽에 이름, 오른쪽에 값. */
export function ProjectOverviewFact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-h-9 items-center gap-4">
      <dt className="w-24 shrink-0 text-sm text-muted-foreground">{label}</dt>
      <dd className="flex min-w-0 flex-1 items-center gap-2 text-sm">{children}</dd>
    </div>
  );
}
