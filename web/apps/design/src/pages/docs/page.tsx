import { Link, createFileRoute } from "@tanstack/react-router";
import { CopyCodeBlock } from "@/shared/ui";

export const Route = createFileRoute("/docs/")({
  component: DocsOverviewPage,
});

const LAYERS = [
  {
    step: "01",
    name: "Design Tokens",
    pkg: "@goraebap/design-system/styles",
    summary: "OKLCH 시맨틱 색상, 4단계 면 위계, App과 Editorial 테마를 CSS 변수로 정의합니다.",
    to: "/docs/tokens" as const,
  },
  {
    step: "02",
    name: "Style Recipes",
    pkg: "@goraebap/design-system/recipes/*",
    summary:
      "CVA와 Tailwind v4로 만든 클래스 함수로, 프레임워크와 무관하게 클래스 문자열을 반환합니다.",
    to: "/docs/recipes" as const,
  },
  {
    step: "03",
    name: "Headless Primitives",
    pkg: "Native HTML · @base-ui/react · @spartan-ng/brain",
    summary: "스타일 없이 포커스, 키보드 탐색, ARIA 속성, 오버레이 동작을 처리합니다.",
    to: "/docs/primitives" as const,
  },
  {
    step: "04",
    name: "UI Components",
    pkg: "@goraebap/ui (React) · Angular Adapter",
    summary: "레시피와 프리미티브를 조합한 13종 컴포넌트를 제공합니다.",
    to: "/components" as const,
  },
  {
    step: "05",
    name: "Templates & Patterns",
    pkg: "AppShell · Dialog ↔ Bottom Sheet",
    summary: "데스크톱과 64rem 미만 모바일의 화면 배치와 전환 패턴을 정리합니다.",
    to: "/templates" as const,
  },
];

function DocsOverviewPage() {
  return (
    <article className="space-y-10">
      <header className="border-border space-y-3 border-b pb-8">
        <h1 className="text-3xl font-semibold tracking-tight">5계층 디자인 시스템</h1>
        <p className="text-muted-foreground text-base leading-relaxed">
          <code className="bg-secondary text-foreground rounded px-1.5 py-0.5 font-mono text-xs">
            @goraebap/design-system
          </code>
          은 1단계 토큰과 2단계 레시피를 프레임워크 코드와 따로 둡니다. Pure HTML, React(Base UI),
          Angular(Spartan Brain)가 같은 CSS 변수와 클래스 함수를 가져다 씁니다.
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">설치 및 스타일 연결</h2>
        <CopyCodeBlock
          label="tailwind.css"
          language="css"
          code={`@import "tailwindcss";
@import "@goraebap/design-system/styles/base.css";
@import "@goraebap/design-system/styles/theme-app.css";
@import "@goraebap/design-system/styles/theme-editorial.css";`}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">계층별 역할</h2>
        <div className="space-y-3">
          {LAYERS.map((layer) => (
            <Link
              key={layer.step}
              to={layer.to}
              className="border-border bg-card hover:border-foreground/30 flex flex-col justify-between gap-2 rounded-2xl border p-5 transition-colors sm:flex-row sm:items-center"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2.5">
                  <span className="text-muted-foreground font-mono text-xs">{layer.step}</span>
                  <h3 className="text-sm font-semibold">{layer.name}</h3>
                </div>
                <p className="text-muted-foreground text-xs">{layer.summary}</p>
              </div>
              <code className="bg-secondary text-muted-foreground shrink-0 rounded-full px-2.5 py-1 font-mono text-[11px]">
                {layer.pkg}
              </code>
            </Link>
          ))}
        </div>
      </section>
    </article>
  );
}
