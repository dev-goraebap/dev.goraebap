import { createFileRoute } from "@tanstack/react-router";
import { CopyCodeBlock } from "@/shared/ui";

export const Route = createFileRoute("/docs/tokens/")({
  component: DocsTokensPage,
});

const SURFACES = [
  { token: "--sidebar", cls: "bg-sidebar", role: "1단계 · 앱 셸 외곽 사이드바" },
  { token: "--background", cls: "bg-background", role: "2단계 · 기본 페이지 캔버스" },
  { token: "--card", cls: "bg-card", role: "3단계 · 페이지 위에 올린 카드·패널" },
  { token: "--popover", cls: "bg-popover", role: "4단계 · 최상위 팝오버·대화상자" },
];

const SEMANTIC = [
  { token: "--primary", cls: "bg-primary text-primary-foreground", label: "Primary" },
  { token: "--secondary", cls: "bg-secondary text-secondary-foreground", label: "Secondary" },
  { token: "--muted", cls: "bg-muted text-muted-foreground", label: "Muted" },
  { token: "--destructive", cls: "bg-destructive text-white", label: "Destructive" },
  { token: "--success", cls: "bg-success text-white", label: "Success" },
  { token: "--warning", cls: "bg-warning text-black", label: "Warning" },
  { token: "--info", cls: "bg-info text-white", label: "Info" },
];

function DocsTokensPage() {
  return (
    <article className="space-y-10">
      <header className="border-border space-y-3 border-b pb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Design Tokens</h1>
        <p className="text-muted-foreground text-base leading-relaxed">
          색상, 면 위계, 반경, 타이포그래피를 프레임워크에 묶이지 않은 OKLCH CSS 변수로 정의합니다.
          라이트와 다크 모드, App과 Editorial 테마는 같은 변수 이름의 값만 바꿉니다.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">4단계 면 위계 (Surface Hierarchy)</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {SURFACES.map((item) => (
            <div
              key={item.token}
              className="border-border bg-card flex items-center gap-4 rounded-xl border p-4"
            >
              <div className={`border-border size-12 shrink-0 rounded-lg border ${item.cls}`} />
              <div>
                <p className="font-mono text-xs font-medium">{item.token}</p>
                <p className="text-muted-foreground mt-0.5 text-xs">{item.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">시맨틱 색상 토큰</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SEMANTIC.map((item) => (
            <div
              key={item.token}
              className="border-border bg-card flex items-center justify-between rounded-xl border p-3.5"
            >
              <span className="font-mono text-xs">{item.token}</span>
              <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${item.cls}`}>
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">테마 스코핑</h2>
        <CopyCodeBlock
          label="theme-usage.html"
          language="html"
          code={`<!-- 앱 전역 또는 특정 섹션에만 테마 적용 -->
<section data-theme="app">...</section>
<section data-theme="editorial">...</section>`}
        />
      </section>
    </article>
  );
}
