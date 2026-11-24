import type { CSSProperties, ReactNode } from "react";
import { cn } from "@goraebap/design-system/cn";
import { LayoutSlot as Slot } from "./LayoutSlot";

export type AppShellVariant = "inset" | "split";

function SidebarAnatomy() {
  return (
    <div className="flex h-full w-full flex-col gap-2 p-2">
      <div className="flex h-13 shrink-0 gap-2">
        <Slot label="Logo" className="w-16 shrink-0" />
        <Slot label="Space" className="flex-1" />
      </div>
      <Slot label="Global" className="h-28 shrink-0" />
      <Slot label="Menu" className="flex-1" />
      <Slot label="Profile" className="h-12 shrink-0" />
    </div>
  );
}

function CollapsedSidebarAnatomy() {
  return (
    <div className="flex h-full w-full flex-col gap-2 p-2">
      <Slot label="L" className="h-13 shrink-0" />
      <Slot label="G" className="h-24 shrink-0" />
      <Slot label="M" className="flex-1" />
      <Slot label="P" className="h-10 shrink-0" />
    </div>
  );
}

function AppShellFrame({
  variant,
  sidebar,
  sidebarWidthClass = "w-72",
  children,
}: {
  variant: AppShellVariant;
  sidebar?: ReactNode;
  sidebarWidthClass?: string;
  children: ReactNode;
}) {
  return (
    <div className="bg-sidebar flex h-full flex-col @5xl:flex-row">
      <aside className={cn("hidden shrink-0 @5xl:flex", sidebarWidthClass)}>
        {sidebar ?? (
          <div className="flex w-full p-2">
            <Slot label="Sidebar" className="flex-1" />
          </div>
        )}
      </aside>
      <div
        className={cn(
          "bg-background flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
          variant === "inset"
            ? "@5xl:border-border @5xl:my-2 @5xl:mr-2 @5xl:rounded-2xl @5xl:border @5xl:shadow-xs"
            : "@5xl:border-border @5xl:border-l",
        )}
      >
        <Slot label="App Bar" className="m-2 mb-0 h-15 shrink-0 @5xl:hidden" />
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        <Slot label="Bottom Bar" className="m-2 mt-0 h-14 shrink-0 @5xl:hidden" />
      </div>
    </div>
  );
}

export function AppShellPreview({ variant }: { variant: AppShellVariant }) {
  return (
    <AppShellFrame variant={variant}>
      <div className="flex min-h-0 flex-1 p-2">
        <Slot label="Main" className="flex-1" />
      </div>
    </AppShellFrame>
  );
}

export function AppShellSidebarExample({ variant }: { variant: AppShellVariant }) {
  return (
    <AppShellFrame variant={variant} sidebar={<SidebarAnatomy />}>
      <div className="flex min-h-0 flex-1 p-2">
        <Slot label="Main" className="flex-1" />
      </div>
    </AppShellFrame>
  );
}

export function AppShellCollapsedSidebarExample({ variant }: { variant: AppShellVariant }) {
  return (
    <AppShellFrame variant={variant} sidebar={<CollapsedSidebarAnatomy />} sidebarWidthClass="w-16">
      <div className="flex min-h-0 flex-1 p-2">
        <Slot label="Main" className="flex-1" />
      </div>
    </AppShellFrame>
  );
}

export function SidebarContentPreview() {
  return (
    <div className="bg-background flex h-full flex-col">
      <Slot label="Header" className="m-2 mb-0 h-14 shrink-0" />
      <div className="flex min-h-0 flex-1 gap-3 p-2">
        <Slot label="Sidebar" className="hidden w-56 shrink-0 @5xl:flex" />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Slot label="Main" className="flex-1" />
          <Slot label="Footer" className="h-16 shrink-0" />
        </div>
      </div>
    </div>
  );
}

export function SingleColumnPreview() {
  return (
    <div className="bg-background flex h-full flex-col gap-2 p-2">
      <Slot label="Header" className="h-14 shrink-0" />
      <div className="flex min-h-0 flex-1 justify-center">
        <Slot label="Main" className="w-full max-w-2xl" />
      </div>
      <Slot label="Footer" className="h-16 shrink-0" />
    </div>
  );
}

export function LandingPreview() {
  return (
    <div className="bg-background flex h-full flex-col gap-2 p-2">
      <Slot label="Header" className="h-12 shrink-0" />
      <Slot label="Hero Section" className="h-28 shrink-0" />
      <Slot label="Stats Bar" className="h-10 shrink-0" />
      <div className="grid min-h-0 flex-1 grid-cols-12 gap-2">
        <Slot label="Bento Main" className="col-span-7" />
        <div className="col-span-5 flex flex-col gap-2">
          <Slot label="Bento Sub" className="flex-1" />
          <Slot label="Bento Sub" className="flex-1" />
        </div>
      </div>
      <Slot label="Feature Split · CTA" className="h-16 shrink-0" />
      <Slot label="Footer" className="h-12 shrink-0" />
    </div>
  );
}

export function LayoutThumbnail({ children }: { children: ReactNode }) {
  return (
    <div aria-hidden="true" className="ring-border h-36 w-56 overflow-hidden rounded-md ring-1">
      <div
        data-thumb=""
        className="group/layout @container h-[50.125rem] w-[78rem] origin-top-left"
        style={{ transform: "scale(0.1795)", "--layout-scale": 0.1795 } as CSSProperties}
      >
        {children}
      </div>
    </div>
  );
}
