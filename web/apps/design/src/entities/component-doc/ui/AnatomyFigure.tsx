import type { ReactNode } from "react";
import { SystemIcon } from "@goraebap/ui-react/icons";

function Marker({ n, className }: { n: number; className: string }) {
  return (
    <span
      aria-hidden="true"
      className={`bg-primary text-primary-foreground ring-background absolute z-10 flex size-5 items-center justify-center rounded-full text-[11px] font-semibold ring-2 ${className}`}
    >
      {n}
    </span>
  );
}

function ButtonAnatomy() {
  return (
    <div className="relative">
      <Marker n={1} className="-top-2.5 -left-2.5" />
      <div className="bg-primary text-primary-foreground inline-flex h-12 items-center gap-2.5 rounded-lg px-6 text-base font-medium">
        <span className="relative flex">
          <SystemIcon name="check" className="size-5" />
          <Marker n={2} className="-bottom-7 left-1/2 -translate-x-1/2" />
        </span>
        <span className="relative">
          변경 사항 저장
          <Marker n={3} className="-bottom-7 left-1/2 -translate-x-1/2" />
        </span>
      </div>
    </div>
  );
}

function DialogAnatomy() {
  return (
    <div className="flex w-full max-w-xs flex-col items-center gap-4">
      <div className="relative w-full">
        <Marker n={1} className="-top-2.5 -left-2.5" />
        <div className="border-border/80 rounded-xl border border-dashed p-3">
          <div className="relative mb-3 w-fit">
            <Marker n={2} className="-top-2 -right-3" />
            <div className="bg-primary text-primary-foreground rounded-md px-3 py-1 text-xs font-medium">
              열기
            </div>
          </div>
          <div className="border-border bg-popover relative rounded-lg border p-3 shadow-sm">
            <Marker n={3} className="-top-2 -left-2" />
            <div className="border-border/80 relative rounded-md border border-dashed p-2">
              <Marker n={4} className="-top-2 right-5" />
              <div className="relative w-fit">
                <Marker n={5} className="top-1/2 -right-6 -translate-y-1/2" />
                <p className="text-foreground text-xs font-semibold">프로젝트 이름 바꾸기</p>
              </div>
              <div className="relative mt-1 w-fit">
                <Marker n={6} className="top-1/2 -right-6 -translate-y-1/2" />
                <p className="text-muted-foreground text-[11px]">새 이름을 입력합니다.</p>
              </div>
            </div>
            <div className="bg-hatch border-border my-2 h-8 rounded-md border" />
            <div className="border-border/80 relative flex justify-end gap-1.5 rounded-md border border-dashed p-1.5">
              <Marker n={7} className="top-1/2 -left-2 -translate-y-1/2" />
              <span className="text-muted-foreground px-2 py-0.5 text-[11px]">취소</span>
              <span className="relative">
                <span className="bg-primary text-primary-foreground block rounded px-2 py-0.5 text-[11px]">
                  저장
                </span>
                <Marker n={8} className="-top-3 -right-2" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BottomSheetAnatomy() {
  return (
    <div className="relative w-full max-w-56">
      <Marker n={1} className="-top-2.5 -left-2.5" />
      <div className="border-foreground/70 bg-background relative flex aspect-[9/14] flex-col overflow-hidden rounded-2xl border-2">
        <div className="bg-hatch flex-1 p-3">
          <div className="relative w-fit">
            <Marker n={2} className="-top-2 -right-3" />
            <div className="bg-primary text-primary-foreground rounded-md px-3 py-1 text-xs font-medium">
              열기
            </div>
          </div>
        </div>
        <div className="border-border bg-popover relative rounded-t-xl border-t p-3 pt-2 shadow-lg">
          <Marker n={3} className="-top-2.5 right-3" />
          <div className="bg-border mx-auto mb-2.5 h-1 w-8 rounded-full" />
          <div className="relative w-fit">
            <Marker n={4} className="top-1/2 -right-6 -translate-y-1/2" />
            <p className="text-foreground text-xs font-semibold">필터 설정</p>
          </div>
          <div className="relative mt-1 w-fit">
            <Marker n={5} className="top-1/2 -right-6 -translate-y-1/2" />
            <p className="text-muted-foreground text-[11px]">조건을 고릅니다.</p>
          </div>
          <div className="border-border/80 relative mt-3 space-y-1 rounded-md border border-dashed p-1.5">
            <Marker n={6} className="top-1/2 -left-2 -translate-y-1/2" />
            <span className="relative block">
              <span className="bg-primary text-primary-foreground block rounded py-0.5 text-center text-[11px]">
                적용
              </span>
              <Marker n={7} className="top-1/2 -right-2 -translate-y-1/2" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

const FIGURES: Partial<Record<string, () => ReactNode>> = {
  button: ButtonAnatomy,
  dialog: DialogAnatomy,
  "bottom-sheet": BottomSheetAnatomy,
};

export function AnatomyFigure({ slug }: { slug: string }) {
  const Figure = FIGURES[slug];
  return Figure ? <Figure /> : null;
}
