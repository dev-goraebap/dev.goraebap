import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Popover, PopoverContent, PopoverTrigger } from "@goraebap/ui-react/components/popover";
import { SystemIcon } from "@goraebap/ui-react/icons";
import { BrandMark } from "./BrandMark";
import { Wordmark } from "./Wordmark";

export function WorkspaceSwitcher() {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-w-0 items-center gap-2.5">
      <Link
        to="/"
        aria-label="dev.goraebap 처음으로"
        className="bg-primary text-primary-foreground inline-flex size-9 shrink-0 items-center justify-center rounded-md transition-transform hover:scale-105"
      >
        <BrandMark className="size-7" />
      </Link>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger className="hover:bg-accent/70 focus-visible:outline-ring flex min-w-0 cursor-pointer items-center gap-1.5 rounded-md px-1.5 py-1 text-sm font-semibold tracking-tight transition-colors focus-visible:outline-2 focus-visible:outline-offset-2">
          <Wordmark className="hidden h-5 w-auto shrink-0 sm:block" />
          <span
            aria-hidden="true"
            className="text-muted-foreground/60 hidden font-normal sm:inline"
          >
            /
          </span>
          <span>Frontend</span>
          <SystemIcon name="chevronDown" className="text-muted-foreground size-3.5 shrink-0" />
        </PopoverTrigger>
        <PopoverContent side="bottom" align="start" className="w-64 p-1.5">
          <p className="text-muted-foreground px-2.5 pt-1.5 pb-1 text-xs font-medium">
            워크스페이스
          </p>
          <Link
            to="/frontend/overview"
            aria-current="true"
            onClick={() => setOpen(false)}
            className="hover:bg-accent flex w-full cursor-pointer items-center justify-between gap-3 rounded-md px-2.5 py-2 text-left transition-colors"
          >
            <span className="min-w-0">
              <span className="block text-sm font-medium">Frontend</span>
              <span className="text-muted-foreground block text-xs">
                디자인 시스템과 프로젝트 구성
              </span>
            </span>
            <SystemIcon name="check" className="size-4 shrink-0" />
          </Link>
          <div
            aria-disabled="true"
            className="flex items-center justify-between gap-3 rounded-md px-2.5 py-2 opacity-60"
          >
            <span className="min-w-0">
              <span className="block text-sm font-medium">Backend</span>
              <span className="text-muted-foreground block text-xs">API, 데이터, 서버 구조</span>
            </span>
            <span className="text-muted-foreground shrink-0 text-[11px] font-medium">준비 중</span>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
