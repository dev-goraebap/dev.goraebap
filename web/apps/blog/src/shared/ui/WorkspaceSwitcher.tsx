import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Popover, PopoverContent, PopoverTrigger } from "@goraebap/ui-react/components/popover";
import { SystemIcon } from "@goraebap/ui-react/icons";
import { SITE_SPACES, activeSpace } from "@/shared/config/site-menus";
import { BrandMark } from "./BrandMark";
import { Wordmark } from "./Wordmark";

export function WorkspaceSwitcher() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({
    select: (state) => state.resolvedLocation?.pathname ?? state.location.pathname,
  });
  const current = activeSpace(pathname);

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
              <span className="text-foreground truncate text-sm font-semibold tracking-tight">
                {current.label}
              </span>
            </>
          )}
          <SystemIcon name="chevronDown" className="text-muted-foreground size-3.5 shrink-0" />
        </PopoverTrigger>
        <PopoverContent side="bottom" align="start" className="w-72 p-1.5">
          <p className="text-muted-foreground px-2.5 pt-1.5 pb-1 text-xs font-medium">공간</p>
          {SITE_SPACES.map((space) => (
            <Link
              key={space.id}
              to={space.to}
              aria-current={space.id === current?.id ? "true" : undefined}
              onClick={() => setOpen(false)}
              className="hover:bg-accent flex w-full cursor-pointer items-center justify-between gap-3 rounded-md px-2.5 py-2 text-left transition-colors"
            >
              <span className="min-w-0">
                <span className="block text-sm font-medium">{space.label}</span>
                <span className="text-muted-foreground block text-xs">{space.description}</span>
              </span>
              {space.id === current?.id && (
                <SystemIcon name="check" className="size-4 shrink-0" />
              )}
            </Link>
          ))}
        </PopoverContent>
      </Popover>
    </div>
  );
}
