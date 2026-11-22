import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@goraebap/ui/components/badge";
import { Button } from "@goraebap/ui/components/button";
import { PreviewStage } from "@/shared/ui";

export const Route = createFileRoute("/ui/patterns/")({
  component: UiPatternsPage,
});

const APP_SHELL_CODE = `<AppShell brand="goraebap accounts" navItems={ACCOUNT_NAV_ITEMS}>
  <PageHeader title="계정 허브" />
  {/* 데스크톱(>=64rem): 좌측 사이드바 + 둥근 인셋 페이지 */}
  {/* 모바일(<64rem): 상단 바 + 본문 + 하단 탭 바 */}
</AppShell>`;

function UiPatternsPage() {
  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <Badge variant="outline">LAYER 05 · PATTERNS</Badge>
        <h1 className="text-2xl font-semibold tracking-tight">Patterns (데스크톱 ↔ 모바일)</h1>
        <p className="text-muted-foreground text-sm">
          단일 분기점(64rem)을 기준으로 데스크톱과 모바일 배치가 어떻게 전환되는지 직접 확인합니다.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-base font-semibold tracking-tight">
          AppShell (인셋 사이드바 ↔ 하단 탭 바)
        </h2>
        <PreviewStage
          title="AppShell"
          code={APP_SHELL_CODE}
          mobileNote="모바일에서는 좌측 사이드바가 사라지고 상단 앱 바 + 하단 탭 바로 전환됩니다."
        >
          {({ isMobile }) =>
            isMobile ? (
              <div className="border-border bg-sidebar flex h-80 flex-col overflow-hidden rounded-xl border">
                <div className="border-border flex h-11 items-center justify-between border-b px-3">
                  <span className="text-xs font-semibold">goraebap</span>
                  <Badge variant="outline">Mobile</Badge>
                </div>
                <div className="bg-background flex-1 space-y-2 p-4">
                  <p className="text-sm font-semibold">계정 허브</p>
                  <p className="text-muted-foreground text-xs">
                    본문은 풀 폭으로 넓어지고 주요 탐색은 엄지가 닿는 하단 탭 바로 내려옵니다.
                  </p>
                </div>
                <div className="border-border bg-sidebar flex h-12 items-center justify-around border-t text-[11px] font-medium">
                  <span className="text-foreground">허브</span>
                  <span className="text-muted-foreground">프로필</span>
                  <span className="text-muted-foreground">보안</span>
                </div>
              </div>
            ) : (
              <div className="border-border bg-sidebar flex h-72 overflow-hidden rounded-xl border">
                <div className="flex w-44 shrink-0 flex-col justify-between p-3">
                  <div className="space-y-3">
                    <div className="px-2 text-xs font-semibold">goraebap</div>
                    <div className="space-y-1 text-xs">
                      <div className="bg-secondary rounded-md px-2 py-1 font-medium">허브</div>
                      <div className="text-muted-foreground px-2 py-1">프로필</div>
                      <div className="text-muted-foreground px-2 py-1">보안 · 토큰</div>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="w-full text-xs">
                    로그아웃
                  </Button>
                </div>
                <div className="flex-1 p-2 pl-0">
                  <div className="border-border bg-background h-full rounded-xl border p-5 shadow-xs">
                    <p className="text-sm font-semibold">계정 허브</p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      바닥(--sidebar) 위에 둥근 인셋 페이지 면(--background)이 올라가는 업무 앱 표준
                      셸입니다.
                    </p>
                  </div>
                </div>
              </div>
            )
          }
        </PreviewStage>
      </section>
    </div>
  );
}
