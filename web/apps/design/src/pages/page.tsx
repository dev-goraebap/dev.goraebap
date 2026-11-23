import { useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Badge } from "@goraebap/ui-react/components/badge";
import { Button } from "@goraebap/ui-react/components/button";
import { Separator } from "@goraebap/ui-react/components/separator";
import { SystemIcon } from "@goraebap/ui-react/icons";
import { COMPONENT_DOCS } from "@/entities/component-doc";
import { DETAIL_DOCS } from "@/entities/detail-doc";
import { LAYOUT_DOCS } from "@/entities/layout-doc";
import { THEME_PRESETS, type ThemePresetId } from "@/shared/lib/design-config";
import { CodeView } from "@/shared/ui";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

const STATS = [
  { value: `${COMPONENT_DOCS.length}종`, label: "공통 UI 컴포넌트", to: "/components" as const },
  { value: `${THEME_PRESETS.length}개`, label: "라이트·다크 테마", to: "/themes" as const },
  { value: `${LAYOUT_DOCS.length}종`, label: "앱·메인 레이아웃", to: "/layouts" as const },
  { value: `${DETAIL_DOCS.length}가지`, label: "UI 마감 디테일", to: "/details" as const },
];

function LandingPage() {
  const [heroTheme, setHeroTheme] = useState<ThemePresetId>("app");
  const [heroAdapter, setHeroAdapter] = useState<"react" | "angular">("react");

  const featuredComponents = COMPONENT_DOCS.slice(0, 6);
  const activePreset = THEME_PRESETS.find((t) => t.id === heroTheme) ?? THEME_PRESETS[0];

  const heroCode =
    heroAdapter === "react"
      ? `import { Button } from "@goraebap/ui-react/components/button";

<Button variant="default" size="sm">저장</Button>`
      : `import { buttonVariants } from "@goraebap/design-system/recipes/button";

@Directive({ selector: "button[gbButton]", host: { "[class]": "cls()" } })
export class GbButton { cls = computed(() => buttonVariants({ size: "sm" })); }`;

  const heroLang = heroAdapter === "react" ? "tsx" : "angular-ts";

  return (
    <main className="mx-auto max-w-7xl space-y-24 px-6 py-16 sm:py-24">
      {/* 1. Hero Section */}
      <section className="space-y-12 text-center">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="flex justify-center">
            <Link
              to="/overview"
              className="border-border bg-card text-muted-foreground hover:text-foreground inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-xs transition-colors"
            >
              <SystemIcon name="details" className="text-primary size-3.5" />
              <span>React · Angular 단일 원본 디자인 시스템</span>
              <SystemIcon name="arrowRight" className="size-3" />
            </Link>
          </div>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl sm:leading-[1.08]">
            하나의 디자인 기준을
            <br />
            모든 프론트엔드에
          </h1>
          <p className="text-muted-foreground mx-auto max-w-2xl text-base leading-7 break-keep sm:text-lg">
            색상 토큰과 스타일 레시피를 한곳에서 정의하고, React(@goraebap/ui-react) 프로토타입·개인
            프로젝트부터 Angular(Spartan Brain) 업무 프로젝트까지 같은 외형과 마감 기준을
            공유합니다.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button
              size="lg"
              shape="pill"
              nativeButton={false}
              render={<Link to="/getting-started" />}
            >
              <span>시작하기</span>
              <SystemIcon name="arrowRight" className="size-4" />
            </Button>
            <Button
              size="lg"
              variant="secondary"
              shape="pill"
              nativeButton={false}
              render={<Link to="/components" />}
            >
              컴포넌트 보기
            </Button>
          </div>
        </div>

        {/* Interactive Hero Stage */}
        <div
          data-ds-theme={heroTheme}
          className="border-border bg-card mx-auto max-w-5xl overflow-hidden rounded-3xl border text-left shadow-sm transition-colors"
        >
          <div className="border-border bg-muted/35 flex flex-wrap items-center justify-between gap-3 border-b px-5 py-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {THEME_PRESETS.map((t) => (
                <Button
                  key={t.id}
                  type="button"
                  size="sm"
                  shape="pill"
                  variant={heroTheme === t.id ? "default" : "ghost"}
                  onClick={() => setHeroTheme(t.id)}
                  className="h-7 px-3 text-xs"
                >
                  {t.name}
                </Button>
              ))}
            </div>

            <div className="border-border bg-background inline-flex items-center gap-0.5 rounded-full border p-0.5">
              {(
                [
                  { id: "react", label: "React" },
                  { id: "angular", label: "Angular" },
                ] as const
              ).map((a) => (
                <Button
                  key={a.id}
                  type="button"
                  size="sm"
                  shape="pill"
                  variant={heroAdapter === a.id ? "secondary" : "ghost"}
                  onClick={() => setHeroAdapter(a.id)}
                  className="h-7 px-3 text-xs"
                >
                  {a.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="bg-dots bg-background/60 grid grid-cols-1 gap-5 p-6 md:grid-cols-12">
            <div className="border-border bg-card flex flex-col justify-between space-y-5 rounded-2xl border p-5 md:col-span-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline">{activePreset.name}</Badge>
                  <span className="text-muted-foreground font-mono text-[11px]">
                    {heroAdapter === "react" ? "@base-ui/react" : "@spartan-ng/brain"}
                  </span>
                </div>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  {activePreset.subtitle}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm">저장</Button>
                <Button variant="secondary" size="sm">
                  미리보기
                </Button>
                <Button variant="outline" size="sm" shape="pill">
                  Pill
                </Button>
              </div>
            </div>

            <div className="border-border bg-card flex flex-col justify-between rounded-2xl border p-5 md:col-span-7">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3">
                <span className="text-muted-foreground font-mono text-xs">
                  {heroAdapter === "react"
                    ? "Button.tsx (@goraebap/ui-react)"
                    : "gb-button.directive.ts (@spartan-ng/brain)"}
                </span>
                <Badge variant="secondary">@goraebap/design-system</Badge>
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

      {/* 2. Stats Section */}
      <section className="border-border bg-card grid grid-cols-2 divide-x divide-y rounded-3xl border sm:grid-cols-4 sm:divide-y-0">
        {STATS.map((stat) => (
          <Link
            key={stat.label}
            to={stat.to}
            className="hover:bg-accent/40 flex flex-col gap-1 p-6 transition-colors first:rounded-tl-3xl last:rounded-br-3xl sm:first:rounded-l-3xl sm:last:rounded-r-3xl"
          >
            <span className="text-2xl font-semibold tracking-tight sm:text-3xl">{stat.value}</span>
            <span className="text-muted-foreground text-xs">{stat.label}</span>
          </Link>
        ))}
      </section>

      {/* 3. Bento Grid Section */}
      <section className="space-y-8">
        <div className="max-w-2xl space-y-2">
          <p className="text-primary font-mono text-xs font-medium uppercase">Building Blocks</p>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            컴포넌트부터 레이아웃, 테마, 디테일까지
          </h2>
        </div>

        <div className="grid gap-4 lg:grid-cols-12">
          {/* Components Bento Card */}
          <Link
            to="/components"
            className="border-border bg-card hover:border-foreground/30 group flex flex-col justify-between gap-6 rounded-3xl border p-6 transition-colors lg:col-span-7"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <SystemIcon name="components" className="text-primary size-4" />
                <h3 className="text-lg font-semibold tracking-tight">
                  {COMPONENT_DOCS.length}종 컴포넌트
                </h3>
              </div>
              <p className="text-muted-foreground text-sm">
                Base UI와 Spartan Brain이 공통 지원하는 인터랙션 컴포넌트와 스타일 레시피를 한곳에서
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

          {/* Right Column: Themes + Layouts */}
          <div className="flex flex-col gap-4 lg:col-span-5">
            <Link
              to="/themes"
              className="border-border bg-card hover:border-foreground/30 flex flex-1 flex-col justify-between gap-5 rounded-3xl border p-6 transition-colors"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <SystemIcon name="palette" className="text-primary size-4" />
                  <h3 className="text-lg font-semibold tracking-tight">5가지 라이트·다크 테마</h3>
                </div>
                <p className="text-muted-foreground text-sm">
                  Neutral, Editorial, Ocean, Forest, Terracotta 팔레트를 반경·폰트·아이콘과 함께
                  실시간으로 조합합니다.
                </p>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {THEME_PRESETS.map((preset) => (
                  <div
                    key={preset.id}
                    className="border-border bg-background space-y-1.5 rounded-xl border p-2 text-center"
                  >
                    <div className="flex gap-0.5">
                      <span
                        className="h-4 flex-1 rounded-sm"
                        style={{ backgroundColor: preset.swatches[0] }}
                      />
                      <span
                        className="h-4 flex-1 rounded-sm"
                        style={{ backgroundColor: preset.swatches[3] }}
                      />
                    </div>
                    <p className="truncate text-[10px] font-medium">{preset.name}</p>
                  </div>
                ))}
              </div>
            </Link>

            <div className="grid gap-4 sm:grid-cols-2">
              <Link
                to="/layouts"
                className="border-border bg-card hover:border-foreground/30 flex flex-col justify-between gap-4 rounded-3xl border p-6 transition-colors"
              >
                <div className="space-y-1.5">
                  <SystemIcon name="layouts" className="text-primary size-4" />
                  <h3 className="text-base font-semibold tracking-tight">레이아웃</h3>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    워크스페이스, 문서, 단일 페이지, 랜딩 골격과 메인 영역 배치를 다룹니다.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-medium">
                  살펴보기 <SystemIcon name="arrowRight" className="size-3.5" />
                </span>
              </Link>

              <Link
                to="/details"
                className="border-border bg-card hover:border-foreground/30 flex flex-col justify-between gap-4 rounded-3xl border p-6 transition-colors"
              >
                <div className="space-y-1.5">
                  <SystemIcon name="details" className="text-primary size-4" />
                  <h3 className="text-base font-semibold tracking-tight">디테일</h3>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    스크롤바, 페이지 전환, 초기 진입, 적응형 UI, 라우팅 마스크 마감 기준입니다.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-medium">
                  살펴보기 <SystemIcon name="arrowRight" className="size-3.5" />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Separator variant="wave" />

      {/* 4. Feature Split Section (Philosophy) */}
      <section className="grid items-center gap-10 lg:grid-cols-12">
        <div className="space-y-5 lg:col-span-5">
          <p className="text-primary font-mono text-xs font-medium uppercase">Architecture</p>
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            프로토타입에서 프로덕션까지 틀어지지 않는 구조
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            React로 빠르게 만든 프로토타입을 Angular 업무 앱으로 옮길 때마다 여백과 스타일이 깨지는
            문제를 없애기 위해, 토큰과 스타일 레시피를 프레임워크 밖으로 분리했습니다.
          </p>
          <div className="pt-1">
            <Button
              variant="outline"
              shape="pill"
              nativeButton={false}
              render={<Link to="/overview" />}
            >
              <span>설계 철학 자세히 읽기</span>
              <SystemIcon name="arrowRight" className="size-4" />
            </Button>
          </div>
        </div>

        <div className="border-border bg-dots bg-card/70 space-y-4 rounded-3xl border p-6 lg:col-span-7">
          <div className="border-border bg-background rounded-2xl border p-4 text-center">
            <p className="text-muted-foreground font-mono text-[11px]">@goraebap/design-system</p>
            <p className="mt-1 text-sm font-semibold">
              CSS 토큰 + 스타일 레시피 (tailwind-variants)
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { name: "React", role: "개인 프로젝트", tech: "@goraebap/ui-react" },
              { name: "Angular", role: "업무 프로젝트", tech: "@spartan-ng/brain" },
            ].map((item) => (
              <div
                key={item.name}
                className="border-border bg-background space-y-1 rounded-2xl border p-4"
              >
                <p className="text-sm font-semibold">{item.name}</p>
                <p className="text-muted-foreground text-xs">{item.role}</p>
                <p className="text-muted-foreground pt-1 font-mono text-[11px]">{item.tech}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Closing CTA Section */}
      <section className="border-border bg-card relative overflow-hidden rounded-3xl border px-6 py-16 text-center">
        <div className="mx-auto max-w-xl space-y-6">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            지금 바로 테마를 바꾸고 컴포넌트를 둘러보세요
          </h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            테마 페이지에서 색상과 반경, 아이콘을 고르면 포털 전체의 컴포넌트와 레이아웃에 즉시
            반영됩니다.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              size="lg"
              shape="pill"
              nativeButton={false}
              render={<Link to="/getting-started" />}
            >
              시작하기
            </Button>
            <Button
              size="lg"
              variant="secondary"
              shape="pill"
              nativeButton={false}
              render={<Link to="/themes" />}
            >
              테마 체험하기
            </Button>
            <Button
              size="lg"
              variant="outline"
              shape="pill"
              nativeButton={false}
              render={<Link to="/overview" />}
            >
              개요 읽기
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
