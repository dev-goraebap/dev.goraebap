import { Button } from "@goraebap/ui-react/components/button";

export function AppShellDesktopPreview() {
  return (
    <div className="border-border bg-sidebar flex h-80 w-full min-w-[40rem] overflow-hidden rounded-2xl border p-2.5">
      <div className="flex w-44 shrink-0 flex-col p-3 text-xs">
        <div className="space-y-2">
          <p className="font-semibold">goraebap</p>
          <div className="bg-accent text-foreground rounded-md px-2.5 py-1.5 font-medium">개요</div>
          <div className="text-muted-foreground px-2.5 py-1.5">프로필</div>
          <div className="text-muted-foreground px-2.5 py-1.5">보안 · 토큰</div>
        </div>
      </div>
      <div className="border-border bg-background min-w-0 flex-1 rounded-xl border p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="truncate text-sm font-semibold">보안 및 토큰</p>
          <Button size="sm">새 토큰 발급</Button>
        </div>
        <ul className="border-border bg-card divide-border mt-4 divide-y rounded-xl border text-xs">
          <li className="flex items-center justify-between px-4 py-3">
            <span className="font-medium">배포 자동화</span>
            <span className="text-muted-foreground">3일 전 사용</span>
          </li>
          <li className="flex items-center justify-between px-4 py-3">
            <span className="font-medium">로컬 개발</span>
            <span className="text-muted-foreground">오늘 사용</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

export function AppShellThumbnail() {
  return (
    <div
      aria-hidden="true"
      className="border-border bg-sidebar flex h-28 w-48 gap-1 rounded-lg border p-1"
    >
      <div className="w-12 space-y-1 p-1">
        <div className="bg-foreground/70 h-1.5 w-7 rounded-full" />
        <div className="bg-accent h-2.5 rounded" />
        <div className="bg-muted-foreground/30 h-1 w-8 rounded-full" />
        <div className="bg-muted-foreground/30 h-1 w-6 rounded-full" />
      </div>
      <div className="border-border bg-background flex-1 space-y-2 rounded border p-2">
        <div className="flex items-center justify-between">
          <div className="bg-foreground/70 h-1.5 w-12 rounded-full" />
          <div className="bg-primary h-3 w-8 rounded-sm" />
        </div>
        <div className="border-border bg-card divide-border divide-y rounded border">
          <div className="h-5" />
          <div className="h-5" />
        </div>
      </div>
    </div>
  );
}

export function DialogThumbnail() {
  return (
    <div aria-hidden="true" className="flex items-end gap-4">
      <div className="border-border bg-muted relative flex h-24 w-36 items-center justify-center rounded-lg border">
        <div className="border-border bg-popover w-24 space-y-1.5 rounded-md border p-2 shadow-md">
          <div className="bg-foreground/70 h-1.5 w-12 rounded-full" />
          <div className="bg-secondary h-3 rounded-sm" />
          <div className="bg-primary ml-auto h-2.5 w-7 rounded-sm" />
        </div>
      </div>
      <div className="border-border bg-muted flex h-24 w-12 flex-col justify-end overflow-hidden rounded-lg border">
        <div className="border-border bg-popover space-y-1 rounded-t-md border-t p-1.5">
          <div className="bg-foreground/70 h-1 w-6 rounded-full" />
          <div className="bg-primary h-2 rounded-sm" />
        </div>
      </div>
    </div>
  );
}
