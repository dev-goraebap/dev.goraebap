import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Popover, PopoverContent, PopoverTrigger } from "@goraebap/ui-react/components/popover";
import { SystemIcon } from "@goraebap/ui-react/icons";
import { BrandMark } from "./BrandMark";
import { Wordmark } from "./Wordmark";

const WORKSPACES = [
  {
    id: "sdlc",
    label: "SDLC",
    description: "요구사항부터 배포와 운영까지",
    to: "/sdlc",
  },
  {
    id: "frontend",
    label: "Frontend",
    description: "디자인 시스템과 프로젝트 구성",
    to: "/frontend/overview",
  },
] as const;

export function WorkspaceSwitcher() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const current = WORKSPACES.find((workspace) => pathname.startsWith(`/${workspace.id}`));

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
          <Wordmark className={`h-5 w-auto shrink-0 ${current ? "hidden sm:block" : ""}`} />
          {current && (
            <>
              <span
                aria-hidden="true"
                className="text-muted-foreground/60 hidden font-normal sm:inline"
              >
                /
              </span>
              <Wordmark name={current.id} className="h-5 w-auto shrink-0" />
            </>
          )}
          <SystemIcon name="chevronDown" className="text-muted-foreground size-3.5 shrink-0" />
        </PopoverTrigger>
        <PopoverContent side="bottom" align="start" className="w-64 p-1.5">
          <p className="text-muted-foreground px-2.5 pt-1.5 pb-1 text-xs font-medium">
            워크스페이스
          </p>
          {WORKSPACES.map((workspace) => (
            <Link
              key={workspace.id}
              to={workspace.to}
              aria-current={workspace.id === current?.id ? "true" : undefined}
              onClick={() => setOpen(false)}
              className="hover:bg-accent flex w-full cursor-pointer items-center justify-between gap-3 rounded-md px-2.5 py-2 text-left transition-colors"
            >
              <span className="min-w-0">
                <span className="block text-sm font-medium">{workspace.label}</span>
                <span className="text-muted-foreground block text-xs">{workspace.description}</span>
              </span>
              {workspace.id === current?.id && (
                <SystemIcon name="check" className="size-4 shrink-0" />
              )}
            </Link>
          ))}
          <div
            aria-disabled="true"
            className="flex items-center justify-between gap-3 rounded-md px-2.5 py-2 opacity-60"
          >
            <span className="min-w-0">
              <span className="block text-sm font-medium">Backend</span>
              <span className="text-muted-foreground block text-xs">API, 데이터, 서버 구조</span>
            </span>
            <span className="text-muted-foreground shrink-0 text-[0.6875rem] font-medium">
              준비 중
            </span>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
