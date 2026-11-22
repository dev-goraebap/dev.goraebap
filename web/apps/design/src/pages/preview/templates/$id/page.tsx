import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { KeyRound, Menu, ShieldCheck, User, X } from "lucide-react";
import { Badge } from "@goraebap/ui-react/components/badge";
import { Button } from "@goraebap/ui-react/components/button";
import { Input } from "@goraebap/ui-react/components/input";
import { ReactDialogDemo } from "@/entities/component-doc/ui/InteractiveDemos";
import { usePreviewSync } from "@/shared/lib/preview-sync";
import { ThemedPortalScope } from "@/shared/ui";

export const Route = createFileRoute("/preview/templates/$id/")({
  component: TemplateMobilePreviewPage,
});

const SHELL_NAV = [
  { id: "overview", label: "개요", icon: ShieldCheck },
  { id: "profile", label: "프로필", icon: User },
  { id: "security", label: "보안 · 토큰", icon: KeyRound },
] as const;

type ShellNavId = (typeof SHELL_NAV)[number]["id"];

function MobileAppShellPreview() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeNav, setActiveNav] = useState<ShellNavId>("security");
  const [issued, setIssued] = useState(false);

  return (
    <div className="bg-background text-foreground relative flex min-h-screen flex-col">
      {/* Mobile Topbar */}
      <header className="border-border bg-background/90 sticky top-0 z-10 flex items-center justify-between border-b px-4 pt-13 pb-3 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="내비게이션 메뉴 열기"
            className="text-foreground hover:bg-accent -ml-1.5 inline-flex size-9 cursor-pointer items-center justify-center rounded-lg transition-colors"
          >
            <Menu className="size-4.5" />
          </button>
          <span className="text-sm font-semibold tracking-tight">goraebap</span>
        </div>
        <Badge variant="secondary">Accounts</Badge>
      </header>

      {/* Main Content */}
      <main className="flex-1 space-y-4 px-4 pt-5 pb-12">
        <div className="space-y-1">
          <h1 className="text-base font-semibold tracking-tight">
            {SHELL_NAV.find((n) => n.id === activeNav)?.label}
          </h1>
        </div>

        {activeNav === "security" && (
          <div className="space-y-4">
            <div className="border-border bg-card space-y-3 rounded-xl border p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">계정 이메일</span>
                <Badge variant="outline">SSO 활성</Badge>
              </div>
              <Input defaultValue="admin@goraebap.xyz" readOnly />
              <Button
                className="w-full"
                size="lg"
                onClick={() => {
                  setIssued(true);
                  setTimeout(() => setIssued(false), 1800);
                }}
              >
                {issued ? "새 토큰이 발급되었습니다" : "새 토큰 발급"}
              </Button>
            </div>

            <div className="border-border bg-card divide-border divide-y rounded-xl border text-xs">
              <div className="flex items-center justify-between p-3.5">
                <div>
                  <p className="font-medium">MacBook Pro · Chrome</p>
                  <p className="text-muted-foreground text-[11px]">서울 · 현재 세션</p>
                </div>
                <Badge variant="secondary">활성</Badge>
              </div>
              <div className="flex items-center justify-between p-3.5">
                <div>
                  <p className="font-medium">iPhone 15 · Safari</p>
                  <p className="text-muted-foreground text-[11px]">2시간 전 활동</p>
                </div>
                <span className="text-muted-foreground font-mono text-[10px]">SSO</span>
              </div>
            </div>
          </div>
        )}

        {activeNav === "overview" && (
          <div className="border-border bg-card space-y-3 rounded-xl border p-4 text-xs">
            <p className="font-medium">연결된 워크스페이스</p>
            <p className="text-muted-foreground leading-relaxed">
              하나의 중앙 세션으로 accounts · productivity · design 서브도메인을 오갈 수 있습니다.
            </p>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <Badge variant="secondary">accounts</Badge>
              <Badge variant="secondary">productivity</Badge>
              <Badge variant="secondary">design</Badge>
            </div>
          </div>
        )}

        {activeNav === "profile" && (
          <div className="border-border bg-card space-y-3 rounded-xl border p-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium">표시 이름</label>
              <Input defaultValue="Dev Goraebap" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">핸들</label>
              <Input defaultValue="@goraebap" />
            </div>
            <Button className="w-full" size="lg">
              변경 저장
            </Button>
          </div>
        )}
      </main>

      {/* Mobile Sidebar Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-30 flex">
          <button
            type="button"
            aria-label="드로어 닫기"
            onClick={() => setDrawerOpen(false)}
            className="bg-foreground/25 fixed inset-0 backdrop-blur-[2px]"
          />
          <aside className="border-border bg-sidebar relative z-10 flex w-64 max-w-[80vw] flex-col justify-between border-r px-3 pt-13 pb-10 shadow-xl">
            <div className="space-y-4">
              <div className="flex items-center justify-between px-2">
                <span className="text-sm font-semibold">goraebap</span>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="메뉴 닫기"
                  className="text-muted-foreground hover:text-foreground inline-flex size-8 cursor-pointer items-center justify-center rounded-md"
                >
                  <X className="size-4" />
                </button>
              </div>
              <nav className="space-y-1">
                {SHELL_NAV.map((item) => {
                  const Icon = item.icon;
                  const active = activeNav === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveNav(item.id);
                        setDrawerOpen(false);
                      }}
                      className={
                        active
                          ? "bg-accent text-foreground flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs font-medium"
                          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-xs"
                      }
                    >
                      <Icon className="size-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function MobileResponsiveDialogPreview() {
  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <header className="border-border bg-background/90 sticky top-0 z-10 flex items-center justify-between border-b px-4 pt-13 pb-3 backdrop-blur-md">
        <div>
          <h1 className="text-sm font-semibold tracking-tight">프로젝트 설정</h1>
        </div>
      </header>

      <main className="flex flex-1 flex-col justify-center gap-4 px-4 pt-6 pb-12">
        <div className="border-border bg-card space-y-2 rounded-xl border p-4 text-xs">
          <p className="font-medium">현재 프로젝트: dev.goraebap</p>
        </div>
        <ReactDialogDemo isMobile={true} />
      </main>
    </div>
  );
}

function TemplateMobilePreviewPage() {
  const { id } = Route.useParams();
  const { theme } = usePreviewSync();

  return (
    <ThemedPortalScope theme={theme}>
      <div data-ds-theme={theme} className="min-h-screen">
        {id === "app-shell" ? (
          <MobileAppShellPreview />
        ) : id === "responsive-dialog" ? (
          <MobileResponsiveDialogPreview />
        ) : (
          <div className="bg-background text-foreground flex min-h-screen items-center justify-center p-6 text-sm">
            템플릿을 찾을 수 없습니다: {id}
          </div>
        )}
      </div>
    </ThemedPortalScope>
  );
}
