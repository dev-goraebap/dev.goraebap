import { useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Layers } from "lucide-react";
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
  },
  {
    id: "editorial" as const,
    name: "Editorial Theme",
  },
];

const LIBRARY_SECTIONS = [
  { title: "Design Tokens", to: "/foundations/tokens" as const },
  { title: "Style Recipes", to: "/foundations/recipes" as const },
  { title: "Primitives", to: "/adapters/primitives" as const },
  { title: "UI Components", to: "/components" as const },
  { title: "Templates", to: "/templates" as const },
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
          <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl sm:leading-[1.08]">
            프레임워크와 무관한
            <br />
            디자인 시스템
          </h1>
          <p className="text-muted-foreground mx-auto max-w-2xl text-base leading-7 sm:text-lg">
            CSS 토큰과 CVA 스타일 레시피를 한곳에서 관리합니다. Pure HTML과 React(Base UI)에서 같은
            스타일을 쓰고, Angular(Spartan Brain) 예시 코드와 모바일(390px) 패턴을 함께 제공합니다.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              to="/getting-started"
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
          data-ds-theme={heroTheme}
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

          <div className="bg-dots bg-background/60 grid grid-cols-1 gap-5 p-6 md:grid-cols-12">
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
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3">
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
        <h2 className="max-w-2xl text-2xl font-semibold tracking-tight sm:text-3xl">
          하나의 원본. 여러 어댑터. 데스크톱과 모바일 모두.
        </h2>

        <div className="grid gap-4 lg:grid-cols-12">
          <Link
            to="/components"
            className="border-border bg-card hover:border-foreground/30 group flex flex-col justify-between gap-6 rounded-2xl border p-6 transition-colors lg:col-span-7"
          >
            <div className="space-y-2">
              <h3 className="text-lg font-semibold tracking-tight">
                {COMPONENT_DOCS.length}종 컴포넌트 라이브러리
              </h3>
              <p className="text-muted-foreground text-sm">
                Pure HTML만으로 되는 범위와 Base UI, Spartan Brain이 필요한 범위를 프리뷰와 코드로
                비교합니다.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
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

          <div className="flex flex-col gap-4 lg:col-span-5">
            <Link
              to="/themes"
              className="border-border bg-card hover:border-foreground/30 flex flex-1 flex-col justify-between gap-4 rounded-2xl border p-6 transition-colors"
            >
              <div className="space-y-2">
                <h3 className="text-lg font-semibold tracking-tight">App & Editorial 멀티 테마</h3>
                <p className="text-muted-foreground text-sm">
                  4단계 면 위계(--sidebar → --background → --card → --popover)를 유지한 채
                  data-ds-theme 속성으로 제품과 블로그 테마를 바꿉니다.
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
                <h3 className="text-lg font-semibold tracking-tight">
                  데스크톱 ↔ 모바일(390px) 패턴
                </h3>
                <p className="text-muted-foreground text-sm">
                  Inset AppShell과 Dialog에서 Bottom Sheet로의 전환을 데스크톱과 390px 프레임에서
                  비교합니다.
                </p>
              </div>
              <span className="text-foreground inline-flex items-center gap-1 text-xs font-medium">
                템플릿 보기 <ArrowRight className="size-3.5" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Library Sections */}
      <section className="space-y-6">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-2xl font-semibold tracking-tight">라이브러리 구성</h2>
          <Link
            to="/getting-started"
            className="text-muted-foreground hover:text-foreground text-xs font-medium"
          >
            시작하기 →
          </Link>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {LIBRARY_SECTIONS.map((section) => (
            <Link
              key={section.to}
              to={section.to}
              className="border-border bg-card hover:border-foreground/30 flex flex-col justify-between gap-4 rounded-2xl border p-5 transition-colors"
            >
              <h3 className="text-sm font-semibold">{section.title}</h3>
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
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/components"
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-10 items-center rounded-full px-5 text-sm font-medium transition-colors"
            >
              Browse components
            </Link>
            <Link
              to="/getting-started"
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
