import { createFileRoute, Link } from "@tanstack/react-router";
import { Badge } from "@goraebap/ui/components/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@goraebap/ui/components/card";
import { COMPONENT_DOCS } from "@/components/ui-docs/component-catalog";

export const Route = createFileRoute("/ui/")({
  component: UiOverviewPage,
});

const FIVE_LAYERS = [
  {
    step: "01",
    name: "Design Tokens",
    to: "/ui/tokens" as const,
    summary:
      "4단계 면 위계, OKLCH 의미 색상, 반경, 타이포, 64rem 반응형 기준. App과 Editorial 두 테마 프리셋을 제공합니다.",
    packageName: "@goraebap/design-system/styles",
  },
  {
    step: "02",
    name: "Style Recipes",
    to: "/ui/recipes" as const,
    summary:
      "React와 Angular가 동일하게 import하는 프레임워크 무관 Tailwind + CVA 클래스 규칙입니다.",
    packageName: "@goraebap/design-system/recipes",
  },
  {
    step: "03",
    name: "Headless Primitives",
    to: "/ui/primitives" as const,
    summary:
      "스타일 없이 접근성·키보드·포커스 동작만 맡는 계층입니다. React는 Base UI, Angular는 @spartan-ng/brain을 씁니다.",
    packageName: "Base UI · @spartan-ng/brain",
  },
  {
    step: "04",
    name: "UI Components",
    to: "/ui/components/$slug" as const,
    params: { slug: "button" },
    summary:
      "Headless Primitives 위에 Style Recipes를 입혀 완성한 13종 핵심 컴포넌트와 Desktop/Mobile(390px) 라이브 견본입니다.",
    packageName: "@goraebap/ui",
  },
  {
    step: "05",
    name: "Patterns",
    to: "/ui/patterns" as const,
    summary:
      "AppShell(데스크톱 사이드바 ↔ 모바일 하단 바), 반응형 Dialog ↔ Bottom Sheet 등 화면 조합 패턴입니다.",
    packageName: "apps/*",
  },
];

function UiOverviewPage() {
  return (
    <div className="space-y-12">
      <section className="max-w-2xl space-y-3">
        <Badge variant="outline">5-LAYER DESIGN SYSTEM</Badge>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          dev.goraebap 디자인 시스템
        </h1>
        <p className="text-muted-foreground text-[15px] leading-7">
          Tailwind CSS v4와 CVA를 단일 스타일 원본으로 두고, 프레임워크별 Headless Primitives 위에
          UI를 조립합니다. 모든 컴포넌트 문서에서{" "}
          <strong className="text-foreground font-medium">Desktop / Mobile(390px)</strong>과{" "}
          <strong className="text-foreground font-medium">App / Editorial 테마</strong>를 바로
          전환해 확인할 수 있습니다.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-base font-semibold tracking-tight">5계층 구조</h2>
        <div className="grid gap-3">
          {FIVE_LAYERS.map((layer) => (
            <Link
              key={layer.step}
              to={layer.to}
              params={"params" in layer ? layer.params : undefined}
              className="block"
            >
              <Card
                interactive
                padding="sm"
                className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-blog-accent font-mono text-xs">{layer.step}</span>
                    <span className="text-sm font-semibold">{layer.name}</span>
                  </div>
                  <p className="text-muted-foreground text-xs leading-relaxed">{layer.summary}</p>
                </div>
                <span className="text-muted-foreground shrink-0 font-mono text-[11px]">
                  {layer.packageName} →
                </span>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-base font-semibold tracking-tight">
            컴포넌트 빠른 탐색 ({COMPONENT_DOCS.length})
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {COMPONENT_DOCS.map((comp) => (
            <Link
              key={comp.slug}
              to="/ui/components/$slug"
              params={{ slug: comp.slug }}
              className="block"
            >
              <Card interactive padding="sm" className="h-full">
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle>{comp.name}</CardTitle>
                    <Badge variant="muted">{comp.group}</Badge>
                  </div>
                  <CardDescription className="line-clamp-2">{comp.summary}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
