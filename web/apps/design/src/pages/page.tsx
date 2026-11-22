import { useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Code2, Layers, Palette, Smartphone } from "lucide-react";
import { badgeVariants } from "@goraebap/design-system/recipes/badge";
import { buttonVariants } from "@goraebap/design-system/recipes/button";
import { COMPONENT_DOCS } from "@/entities/component-doc";
import { CodeView } from "@/shared/ui";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

const HERO_THEMES = [
  {
    id: "app" as const,
    name: "App Theme",
    desc: "accounts · productivity 제품용 중립 다크/라이트 캔버스",
    badge: "data-theme='app'",
  },
  {
    id: "editorial" as const,
    name: "Editorial Theme",
    desc: "blog · 읽기 중심의 따뜻한 톤과 강조 색",
    badge: "data-theme='editorial'",
  },
];

const FIVE_LAYERS = [
  {
    step: "01",
    title: "Design Tokens",
    desc: "OKLCH 시맨틱 색상 · 4단계 면 위계 · 64rem 기준선",
    to: "/docs/tokens" as const,
  },
  {
    step: "02",
    title: "Style Recipes",
    desc: "프레임워크 무관 CVA + Tailwind v4 클래스 함수",
    to: "/docs/recipes" as const,
  },
  {
    step: "03",
    title: "Primitives",
    desc: "Pure HTML · Base UI (React) · Spartan Brain (Angular)",
    to: "/docs/primitives" as const,
  },
  {
    step: "04",
    title: "UI Components",
    desc: "13종 컴포넌트 · Pure HTML / React / Angular 어댑터 비교",
    to: "/components" as const,
  },
  {
    step: "05",
    title: "Templates",
    desc: "AppShell · 모바일 바텀시트 · 실전 화면 패턴",
    to: "/templates" as const,
  },
];

function LandingPage() {
  const [heroTheme, setHeroTheme] = useState<"app" | "editorial">("app");
  const [heroAdapter, setHeroAdapter] = useState<"html" | "react" | "angular">("html");

  const featuredComponents = COMPONENT_DOCS.slice(0, 6);
  const heroCode =
    heroAdapter === "html"
      ? `<button class="\${buttonVariants({ variant: 'default', size: 'sm' })}">
  저장
</button>`
      : heroAdapter === "react"
        ? `import { Button } from "@goraebap/ui/components/button";

<Button variant="default" size="sm">저장</Button>`
        : `import { buttonVariants } from "@goraebap/design-system/recipes/button";

@Directive({ selector: "button[gbButton]", host: { "[class]": "cls()" } })
export class GbButton { cls = computed(() => buttonVariants({ size: "sm" })); }`;
  const heroLang = heroAdapter === "html" ? "html" : heroAdapter === "react" ? "tsx" : "angular-ts";

  return (
    <main className="mx-auto max-w-7xl space-y-24 px-6 py-16 sm:py-24">
      {/* 1. Hero with Interactive Theme & Adapter Stage */}
      <section className="space-y-10 text-center">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="border-border bg-secondary/60 text-muted-foreground inline-flex items-center gap-2 rounded-full border px-3.5 py-1 font-mono text-xs">
            <span>5-Layer Architecture</span>
            <span>·</span>
            <span>Pure HTML · React · Angular</span>
          </div>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl sm:leading-[1.08]">
            프레임워크와 무관한
            <br />
            디자인 시스템
          </h1>
          <p className="text-muted-foreground mx-auto max-w-2xl text-base leading-7 sm:text-lg">
            CSS 토큰과 CVA 스타일 레시피를 하나의 원본으로 유지하고, Pure HTML·React(Base
            UI)·Angular(Spartan Brain) 어댑터로 동일한 룩앤필과 데스크톱·모바일(390px) 패턴을
            제공합니다.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to="/docs"
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-11 items-center gap-2 rounded-full px-6 text-sm font-medium transition-colors"
            >
              <span>Get started</span>
              <ArrowRight className="size-4" />
            </Link>
            <Link
              to="/components"
              className="border-border bg-secondary text-secondary-foreground hover:bg-accent inline-flex h-11 items-center rounded-full border px-6 text-sm font-medium transition-colors"
            >
              Browse components
            </Link>
          </div>
        </div>

        {/* Interactive Hero Preview Canvas */}
        <div
          data-theme={heroTheme}
          className="border-border bg-card mx-auto max-w-5xl overflow-hidden rounded-3xl border text-left shadow-sm transition-colors"
        >
          <div className="border-border bg-muted/35 flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3">
            <div className="flex items-center gap-2">
              {HERO_THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setHeroTheme(t.id)}
                  className={
                    heroTheme === t.id
                      ? "bg-primary text-primary-foreground cursor-pointer rounded-full px-3 py-1 text-xs font-medium"
                      : "text-muted-foreground hover:text-foreground cursor-pointer rounded-full px-3 py-1 text-xs"
                  }
                >
                  {t.name}
                </button>
              ))}
            </div>

            <div className="border-border bg-background inline-flex items-center rounded-full border p-0.5 text-xs">
              {(
                [
                  { id: "html", label: "Pure HTML" },
                  { id: "react", label: "React" },
                  { id: "angular", label: "Angular" },
                ] as const
              ).map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setHeroAdapter(a.id)}
                  className={
                    heroAdapter === a.id
                      ? "bg-secondary text-foreground cursor-pointer rounded-full px-3 py-1 font-medium"
                      : "text-muted-foreground hover:text-foreground cursor-pointer rounded-full px-3 py-1"
                  }
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-dots bg-background/60 grid gap-5 p-6 md:grid-cols-12">
            {/* Left Live Surface Card */}
            <div className="border-border bg-card space-y-4 rounded-2xl border p-5 md:col-span-5">
              <div className="flex items-center justify-between">
                <span className={badgeVariants({ variant: "outline" })}>
                  {heroTheme === "app" ? "App Theme" : "Editorial Theme"}
                </span>
                <span className="text-muted-foreground font-mono text-[11px]">
                  {heroAdapter === "html"
                    ? "Native HTML"
                    : heroAdapter === "react"
                      ? "@base-ui/react"
                      : "@spartan-ng/brain"}
                </span>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold">동일한 레시피, 다른 런타임</p>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  위 테마·어댑터 토글을 바꿔도 색상 위계와 버튼 스타일 계약은 그대로 유지됩니다.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <button type="button" className={buttonVariants({ size: "sm" })}>
                  저장
                </button>
                <button
                  type="button"
                  className={buttonVariants({ variant: "secondary", size: "sm" })}
                >
                  미리보기
                </button>
                <button
                  type="button"
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  취소
                </button>
              </div>
            </div>

            {/* Right Adapter Code Comparison */}
            <div className="border-border bg-card flex flex-col justify-between rounded-2xl border p-5 md:col-span-7">
              <div className="flex items-center justify-between pb-3">
                <span className="text-muted-foreground font-mono text-xs">
                  {heroAdapter === "html"
                    ? "index.html (프레임워크 0)"
                    : heroAdapter === "react"
                      ? "Button.tsx (@goraebap/ui)"
                      : "gb-button.directive.ts (@spartan-ng/brain)"}
                </span>
                <span className={badgeVariants({ variant: "secondary" })}>
                  @goraebap/design-system
                </span>
              </div>
              <CodeView
                code={heroCode}
                language={heroLang}
                className="border-border bg-background text-foreground overflow-x-auto rounded-xl border p-4 font-mono text-xs leading-relaxed"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. Bento Feature Grid */}
      <section className="space-y-8">
        <div className="max-w-2xl space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            하나의 원본. 여러 어댑터. 데스크톱과 모바일 모두.
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            프레임워크를 바꾸거나 모바일 화면으로 줄어들어도 디자인 언어와 판단 기준이 흔들리지
            않도록 설계했습니다.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-12">
          <Link
            to="/components"
            className="border-border bg-card hover:border-foreground/30 group flex flex-col justify-between gap-6 rounded-2xl border p-6 transition-colors md:col-span-7"
          >
            <div className="space-y-2">
              <div className="text-muted-foreground inline-flex items-center gap-2 font-mono text-xs">
                <Code2 className="size-4" />
                <span>Pure HTML + React + Angular</span>
              </div>
              <h3 className="text-lg font-semibold tracking-tight">
                {COMPONENT_DOCS.length}종 컴포넌트 라이브러리
              </h3>
              <p className="text-muted-foreground text-sm">
                Pure HTML만으로 동작하는 범위와 Base UI · Spartan Brain 어댑터가 필요한 경계를 실행
                가능한 프리뷰로 비교합니다.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {featuredComponents.map((item) => (
                <div
                  key={item.slug}
                  className="border-border bg-background/70 flex h-24 flex-col items-center justify-center rounded-xl border p-3"
                >
                  <div className="scale-90">{item.renderThumbnail()}</div>
                </div>
              ))}
            </div>
          </Link>

          <div className="flex flex-col gap-4 md:col-span-5">
            <Link
              to="/themes"
              className="border-border bg-card hover:border-foreground/30 flex flex-1 flex-col justify-between gap-4 rounded-2xl border p-6 transition-colors"
            >
              <div className="space-y-2">
                <div className="text-muted-foreground inline-flex items-center gap-2 font-mono text-xs">
                  <Palette className="size-4" />
                  <span>Multi-Theme Tokens</span>
                </div>
                <h3 className="text-lg font-semibold tracking-tight">App & Editorial 멀티 테마</h3>
                <p className="text-muted-foreground text-sm">
                  4단계 면 위계(--sidebar → --background → --card → --popover)를 유지하면서 제품과
                  블로그에 맞는 톤을 선언적으로 전환합니다.
                </p>
              </div>
              <span className="text-foreground inline-flex items-center gap-1 text-xs font-medium">
                테마 비교하기 <ArrowRight className="size-3.5" />
              </span>
            </Link>

            <Link
              to="/templates"
              className="border-border bg-card hover:border-foreground/30 flex flex-1 flex-col justify-between gap-4 rounded-2xl border p-6 transition-colors"
            >
              <div className="space-y-2">
                <div className="text-muted-foreground inline-flex items-center gap-2 font-mono text-xs">
                  <Smartphone className="size-4" />
                  <span>64rem Single Breakpoint</span>
                </div>
                <h3 className="text-lg font-semibold tracking-tight">
                  데스크톱 ↔ 모바일(390px) 패턴
                </h3>
                <p className="text-muted-foreground text-sm">
                  Inset AppShell, Dialog → Bottom Sheet 전환 등 실제 제품에서 반복되는 반응형 패턴을
                  390px 프레임에서 바로 검증합니다.
                </p>
              </div>
              <span className="text-foreground inline-flex items-center gap-1 text-xs font-medium">
                템플릿 보기 <ArrowRight className="size-3.5" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* 3. 5-Layer Architecture Strip */}
      <section className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div className="space-y-1">
            <p className="text-muted-foreground font-mono text-xs">ARCHITECTURE</p>
            <h2 className="text-2xl font-semibold tracking-tight">5단계 계층 구조</h2>
          </div>
          <Link
            to="/docs"
            className="text-muted-foreground hover:text-foreground text-xs font-medium"
          >
            전체 문서 보기 →
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {FIVE_LAYERS.map((layer) => (
            <Link
              key={layer.step}
              to={layer.to}
              className="border-border bg-card hover:border-foreground/30 flex flex-col justify-between gap-4 rounded-2xl border p-5 transition-colors"
            >
              <div className="space-y-2">
                <span className="text-muted-foreground font-mono text-xs">{layer.step}</span>
                <h3 className="text-sm font-semibold">{layer.title}</h3>
                <p className="text-muted-foreground text-xs leading-relaxed">{layer.desc}</p>
              </div>
              <Layers className="text-muted-foreground/60 size-4" />
            </Link>
          ))}
        </div>
      </section>

      {/* 4. Closing CTA */}
      <section className="border-border bg-card rounded-3xl border px-6 py-14 text-center">
        <div className="mx-auto max-w-xl space-y-5">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            직접 눌러보고 코드를 복사해 보세요
          </h2>
          <p className="text-muted-foreground text-sm">
            Pure HTML과 React(Base UI) 프리뷰, 그리고 Angular(Spartan Brain) 어댑터 예시를 한
            화면에서 비교할 수 있습니다.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/components"
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-10 items-center rounded-full px-5 text-sm font-medium transition-colors"
            >
              Browse components
            </Link>
            <Link
              to="/docs"
              className="border-border bg-secondary text-secondary-foreground hover:bg-accent inline-flex h-10 items-center rounded-full border px-5 text-sm font-medium transition-colors"
            >
              Read docs
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
