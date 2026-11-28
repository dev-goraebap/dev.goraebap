import type { ReactNode } from "react";
import { StateLandscape, type StateKind } from "./StateLandscape";

export function PageState({
  kind,
  title,
  description,
  action,
  isCompact = false,
  isFullScreen = false,
}: {
  kind: StateKind;
  title: string;
  description?: string;
  action?: ReactNode;
  isCompact?: boolean;
  isFullScreen?: boolean;
}) {
  const Heading = isCompact ? "h2" : "h1";
  // 전체/페이지 상태 화면은 기하학적 정중앙(50%)보다 6%가량 높은 시각적 중심(~44%)에 둔다.
  const spacingClass = isCompact
    ? "py-4"
    : isFullScreen
      ? "min-h-dvh justify-center pt-8 pb-[max(4rem,16dvh)]"
      : "min-h-[60dvh] justify-center pt-8 pb-[max(3rem,12dvh)]";

  return (
    <div
      role="status"
      className={`flex w-full flex-col items-center gap-1 px-4 text-center motion-safe:animate-[page-state-enter_420ms_cubic-bezier(0.2,0,0,1)_both] ${spacingClass}`}
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
