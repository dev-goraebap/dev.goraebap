import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "@goraebap/ui-react/components/popover";
import { resolveMaturity, type MaturityFrontmatter } from "@/shared/lib/maturity";

const SEGMENTS = [1, 2] as const;

export function MaturityMeta({
  primary,
  fallback,
}: {
  primary?: MaturityFrontmatter;
  fallback?: MaturityFrontmatter;
}) {
  const resolved = resolveMaturity(primary, fallback);
  if (!resolved) return null;

  const { spec, note, reviewedAt } = resolved;

  return (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
      <Popover>
        <PopoverTrigger
          openOnHover
          delay={120}
          closeDelay={140}
          className="text-muted-foreground hover:text-foreground focus-visible:outline-ring inline-flex cursor-help items-center gap-2 rounded-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <span className="inline-flex items-center gap-0.5" aria-hidden="true">
            {SEGMENTS.map((index) => (
              <span
                key={index}
                className={
                  index <= spec.level
                    ? "bg-foreground/70 h-1.5 w-3 rounded-full"
                    : "bg-border h-1.5 w-3 rounded-full"
                }
              />
            ))}
          </span>
          <span>
            성숙도 <strong className="text-foreground/85 font-medium">{spec.label}</strong>
          </span>
          {reviewedAt && (
            <>
              <span aria-hidden="true" className="opacity-50">
                ·
              </span>
              <time dateTime={reviewedAt} className="tabular-nums">
                검토 {reviewedAt}
              </time>
            </>
          )}
        </PopoverTrigger>

        <PopoverContent side="bottom" align="start" className="w-80 space-y-3">
          <div className="flex items-baseline justify-between gap-2">
            <PopoverTitle>성숙도 · {spec.label}</PopoverTitle>
            <code className="border-border bg-muted/60 text-muted-foreground rounded-full border px-2 py-0.5 font-mono text-[0.6875rem]">
              {spec.code}
            </code>
          </div>

          <div className="grid grid-cols-2 gap-1.5" aria-hidden="true">
            {SEGMENTS.map((index) => (
              <span
                key={index}
                className={
                  index <= spec.level
                    ? "bg-foreground/80 h-1 rounded-full"
                    : "bg-muted h-1 rounded-full"
                }
              />
            ))}
          </div>

          <PopoverDescription className="leading-relaxed break-keep">
            {note ?? spec.summary}
          </PopoverDescription>

          <dl className="border-border bg-muted/45 space-y-1.5 rounded-lg border px-3 py-2 text-[0.6875rem]">
            <div className="flex items-baseline justify-between gap-2">
              <dt className="text-muted-foreground shrink-0">AI 적용 강도</dt>
              <dd className="text-foreground text-right font-medium break-keep">
                {spec.aiPolicy}
              </dd>
            </div>
            {reviewedAt && (
              <div className="flex items-baseline justify-between gap-2">
                <dt className="text-muted-foreground shrink-0">마지막 검토</dt>
                <dd className="text-foreground tabular-nums">{reviewedAt}</dd>
              </div>
            )}
          </dl>
        </PopoverContent>
      </Popover>
    </div>
  );
}
