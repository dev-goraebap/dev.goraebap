import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Badge } from "@goraebap/ui/components/badge";

export const Route = createFileRoute("/ui/tokens")({
  component: UiTokensPage,
});

const SURFACES = [
  { name: "--sidebar", label: "1. 바닥 (Sidebar)", className: "bg-sidebar" },
  { name: "--background", label: "2. 페이지 (Background)", className: "bg-background" },
  { name: "--card", label: "3. 올린 면 (Card)", className: "bg-card" },
  { name: "--popover", label: "4. 뜬 면 (Popover)", className: "bg-popover shadow-md" },
];

const COLORS = [
  { name: "--primary", swatch: "bg-primary text-primary-foreground", text: "Primary" },
  { name: "--secondary", swatch: "bg-secondary text-secondary-foreground", text: "Secondary" },
  { name: "--muted", swatch: "bg-muted text-muted-foreground", text: "Muted" },
  { name: "--destructive", swatch: "bg-destructive text-destructive-foreground", text: "Error" },
  { name: "--success", swatch: "bg-success text-primary-foreground", text: "Success" },
  { name: "--warning", swatch: "bg-warning text-primary-foreground", text: "Warning" },
  { name: "--info", swatch: "bg-info text-primary-foreground", text: "Info" },
  {
    name: "--border",
    swatch: "bg-background border-2 border-border text-foreground",
    text: "Border",
  },
  { name: "--input", swatch: "bg-background border-2 border-input text-foreground", text: "Input" },
];

function UiTokensPage() {
  const [theme, setTheme] = useState<"app" | "editorial">("app");

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <Badge variant="outline">LAYER 01 · DESIGN TOKENS</Badge>
          <h1 className="text-2xl font-semibold tracking-tight">Design Tokens</h1>
          <p className="text-muted-foreground text-sm">
            shadcn OKLCH 변수 규격 위에 4단계 면 위계와 단일 분기점(64rem)을 얹었습니다.
          </p>
        </div>

        <div className="border-border bg-secondary/60 inline-flex rounded-md border p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setTheme("app")}
            className={
              theme === "app"
                ? "bg-background text-foreground cursor-pointer rounded px-3 py-1 font-medium shadow-xs"
                : "text-muted-foreground hover:text-foreground cursor-pointer rounded px-3 py-1"
            }
          >
            App 테마
          </button>
          <button
            type="button"
            onClick={() => setTheme("editorial")}
            className={
              theme === "editorial"
                ? "bg-background text-foreground cursor-pointer rounded px-3 py-1 font-medium shadow-xs"
                : "text-muted-foreground hover:text-foreground cursor-pointer rounded px-3 py-1"
            }
          >
            Editorial 테마
          </button>
        </div>
      </div>

      <div
        data-ds-theme={theme}
        className="border-border bg-background text-foreground space-y-10 rounded-2xl border p-6 sm:p-8"
      >
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">4단계 면 위계 (Surface Hierarchy)</h2>
          <div className="grid gap-3 sm:grid-cols-4">
            {SURFACES.map((s) => (
              <div
                key={s.name}
                className={`${s.className} border-border flex h-24 flex-col justify-between rounded-xl border p-3.5`}
              >
                <span className="text-xs font-medium">{s.label}</span>
                <code className="text-muted-foreground font-mono text-[11px]">{s.name}</code>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold">의미 색상 토큰 (Semantic Colors)</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {COLORS.map((c) => (
              <div key={c.name} className="border-border bg-card space-y-2 rounded-lg border p-3">
                <div
                  className={`${c.swatch} flex h-10 items-center justify-center rounded-md text-xs font-medium`}
                >
                  {c.text}
                </div>
                <code className="text-muted-foreground block font-mono text-[11px]">{c.name}</code>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold">타이포그래피 & 반응형 분기점</h2>
          <div className="border-border bg-card space-y-4 rounded-xl border p-5">
            <div className="space-y-1">
              <p className="text-2xl font-semibold tracking-tight">페이지 제목 (text-2xl)</p>
              <p className="text-base leading-7">
                긴 글을 읽고 쓰는 본문은 데스크톱·모바일 모두 16px(text-base), 줄 높이 1.7을
                지킵니다.
              </p>
              <p className="text-muted-foreground text-sm">
                목록과 도구 인터페이스는 text-sm(14px), 메타데이터와 칩은 text-xs(12px)를 씁니다.
              </p>
            </div>
            <div className="border-border text-muted-foreground border-t pt-3 font-mono text-xs">
              단일 분기점: 64rem (1024px) · 사이드바 ↔ 하단 바 · 모달 ↔ 바텀시트가 한 점에서 전환
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
