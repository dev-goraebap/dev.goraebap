type AdaptivePattern = "dialog" | "popover" | "menu";

const LABELS: Record<AdaptivePattern, { desktop: string; mobile: string }> = {
  dialog: { desktop: "중앙 모달", mobile: "바텀시트" },
  popover: { desktop: "트리거 옆 팝오버", mobile: "바텀시트" },
  menu: { desktop: "드롭다운 목록", mobile: "바텀시트 목록" },
};

function PageBlocks() {
  return (
    <div className="absolute inset-0 flex flex-col gap-2 p-3">
      <div className="bg-hatch border-border h-5 shrink-0 rounded border" />
      <div className="bg-hatch border-border flex-1 rounded border" />
      <div className="bg-hatch border-border h-8 shrink-0 rounded border" />
    </div>
  );
}

function FormLines() {
  return (
    <div className="space-y-1.5">
      <div className="bg-foreground/70 h-1.5 w-2/5 rounded-full" />
      <div className="bg-muted-foreground/40 h-1 w-4/5 rounded-full" />
      <div className="border-border bg-background mt-2 h-5 rounded border" />
      <div className="flex justify-end gap-1 pt-1">
        <div className="bg-muted h-3 w-7 rounded-sm" />
        <div className="bg-primary h-3 w-7 rounded-sm" />
      </div>
    </div>
  );
}

function ListLines() {
  return (
    <div className="space-y-1">
      <div className="bg-accent h-4 rounded-sm" />
      <div className="bg-muted h-4 rounded-sm" />
      <div className="bg-muted h-4 rounded-sm" />
    </div>
  );
}

function DesktopSurface({ pattern }: { pattern: AdaptivePattern }) {
  if (pattern === "dialog") {
    return (
      <>
        <div className="bg-foreground/20 absolute inset-0" />
        <div className="border-border bg-popover absolute top-1/2 left-1/2 w-2/5 min-w-32 -translate-x-1/2 -translate-y-1/2 rounded-md border p-2.5 shadow-lg">
          <FormLines />
        </div>
      </>
    );
  }
  return (
    <>
      <div className="bg-primary absolute top-[30%] left-[18%] h-4 w-14 rounded-sm" />
      <div className="border-border bg-popover absolute top-[calc(30%+1.25rem)] left-[18%] w-2/5 min-w-32 rounded-md border p-2 shadow-lg">
        {pattern === "menu" ? <ListLines /> : <FormLines />}
      </div>
    </>
  );
}

export function AdaptiveWireframe({ pattern }: { pattern: AdaptivePattern }) {
  const labels = LABELS[pattern];
  return (
    <div className="bg-card grid items-end gap-6 rounded-xl sm:grid-cols-[1fr_auto] sm:gap-10">
      <figure className="min-w-0 space-y-3">
        <div className="border-border bg-background relative aspect-[16/10] overflow-hidden rounded-lg border shadow-xs">
          <PageBlocks />
          <DesktopSurface pattern={pattern} />
        </div>
        <figcaption className="text-muted-foreground text-center text-xs font-medium">
          데스크톱 · {labels.desktop}
        </figcaption>
      </figure>

      <figure className="mx-auto w-36 space-y-3 sm:w-40">
        <div className="border-foreground/70 bg-background relative aspect-[9/18] overflow-hidden rounded-2xl border-2 shadow-xs">
          <PageBlocks />
          <div className="bg-foreground/20 absolute inset-0" />
          <div className="border-border bg-popover absolute inset-x-0 bottom-0 rounded-t-xl border-t p-2.5 pt-1.5 shadow-lg">
            <div className="bg-border mx-auto mb-2 h-0.5 w-6 rounded-full" />
            {pattern === "menu" ? <ListLines /> : <FormLines />}
          </div>
        </div>
        <figcaption className="text-muted-foreground text-center text-xs font-medium">
          모바일 · {labels.mobile}
        </figcaption>
      </figure>
    </div>
  );
}
