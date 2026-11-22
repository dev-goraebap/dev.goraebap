import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Monitor, Smartphone } from "lucide-react";
import { Badge } from "@goraebap/ui/components/badge";
import { Button } from "@goraebap/ui/components/button";
import { ReactDialogDemo } from "@/entities/component-doc/ui/InteractiveDemos";
import { MobileDeviceFrame } from "@/shared/ui";

export const Route = createFileRoute("/templates/")({
  component: TemplatesPage,
});

function TemplatesPage() {
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");
  const isMobile = viewport === "mobile";

  return (
    <main className="mx-auto max-w-7xl space-y-12 px-6 py-12">
      <header className="border-border flex flex-col justify-between gap-4 border-b pb-8 sm:flex-row sm:items-end">
        <div className="space-y-2">
          <p className="text-muted-foreground font-mono text-xs">LAYER 05 · TEMPLATES & PATTERNS</p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Templates &amp; Responsive Patterns
          </h1>
          <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
            단일 기준선(<code className="font-mono">64rem / 1024px</code>) 아래에서 데스크톱 패턴이
            모바일(390px)로 어떻게 자연스럽게 전환되는지 격리된 뷰포트에서 확인합니다.
          </p>
        </div>

        <div className="border-border bg-card inline-flex shrink-0 items-center rounded-full border p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setViewport("desktop")}
            className={
              !isMobile
                ? "bg-primary text-primary-foreground inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3.5 py-1.5 font-medium"
                : "text-muted-foreground hover:text-foreground inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3.5 py-1.5"
            }
          >
            <Monitor className="size-3.5" />
            <span>Desktop</span>
          </button>
          <button
            type="button"
            onClick={() => setViewport("mobile")}
            className={
              isMobile
                ? "bg-primary text-primary-foreground inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3.5 py-1.5 font-medium"
                : "text-muted-foreground hover:text-foreground inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3.5 py-1.5"
            }
          >
            <Smartphone className="size-3.5" />
            <span>Mobile 390px</span>
          </button>
        </div>
      </header>

      {/* Pattern 1: Inset AppShell */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">01. Inset AppShell</h2>
            <p className="text-muted-foreground text-xs">
              --sidebar 외곽 셸 위에 --background 인셋 작업 영역을 얹는 accounts · productivity 공통
              레이아웃
            </p>
          </div>
          <Badge variant="outline">{isMobile ? "Mobile Topbar + Drawer" : "Desktop Inset"}</Badge>
        </div>

        <div
          className={`bg-dots border-border flex justify-center rounded-2xl border ${
            isMobile ? "px-4 py-10 sm:px-8" : "p-6"
          }`}
        >
          {isMobile ? (
            <MobileDeviceFrame path="/preview/templates/app-shell" title="Inset AppShell" />
          ) : (
            <div className="border-border bg-sidebar flex h-80 w-full overflow-hidden rounded-2xl border p-2.5">
              <div className="flex w-44 shrink-0 flex-col justify-between p-3 text-xs">
                <div className="space-y-2">
                  <p className="font-semibold">goraebap</p>
                  <div className="bg-accent text-foreground rounded-md px-2.5 py-1.5 font-medium">
                    개요
                  </div>
                  <div className="text-muted-foreground px-2.5 py-1.5">프로필</div>
                  <div className="text-muted-foreground px-2.5 py-1.5">보안 · 토큰</div>
                </div>
                <span className="text-muted-foreground font-mono text-[10px]">--sidebar</span>
              </div>
              <div className="border-border bg-background flex-1 rounded-xl border p-5">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">보안 및 토큰</p>
                  <Button size="sm">새 토큰 발급</Button>
                </div>
                <div className="border-border bg-card mt-4 rounded-xl border p-4 text-xs">
                  <p className="font-medium">인셋 작업 영역 (--background → --card)</p>
                  <p className="text-muted-foreground mt-1">
                    사이드바와 본문의 경계를 1px 테두리와 4단계 면 위계로 조용히 구분합니다.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Pattern 2: Dialog <-> Bottom Sheet */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">02. Responsive Dialog ↔ Bottom Sheet</h2>
            <p className="text-muted-foreground text-xs">
              상단 뷰포트 토글을 Mobile 390px로 바꾸면 격리된 모바일 화면 하단에서 바텀시트로
              열립니다.
            </p>
          </div>
          <Badge variant="outline">{isMobile ? "Bottom Sheet (390px)" : "Centered Dialog"}</Badge>
        </div>

        <div
          className={`bg-dots border-border flex justify-center rounded-2xl border ${
            isMobile ? "px-4 py-10 sm:px-8" : "p-8"
          }`}
        >
          {isMobile ? (
            <MobileDeviceFrame
              path="/preview/templates/responsive-dialog"
              title="Responsive Bottom Sheet"
            />
          ) : (
            <ReactDialogDemo isMobile={false} />
          )}
        </div>
      </section>
    </main>
  );
}
