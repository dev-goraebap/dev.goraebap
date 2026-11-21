import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { badgeVariants, type BadgeRecipeProps } from "@goraebap/design-system/recipes/badge";
import { buttonVariants, type ButtonRecipeProps } from "@goraebap/design-system/recipes/button";
import { inputVariants } from "@goraebap/design-system/recipes/input";
import { Badge } from "@goraebap/ui/components/badge";
import { Button } from "@goraebap/ui/components/button";
import { Input } from "@goraebap/ui/components/input";
import { CopyCommand } from "@/components/copy-command";

export const Route = createFileRoute("/ui")({
  component: UiShowcasePage,
});

const LAYERS = [
  {
    step: "01",
    name: "Design Tokens",
    role: "CSS 변수 · 테마 프리셋",
    owner: "@goraebap/design-system",
  },
  {
    step: "02",
    name: "Style Recipes",
    role: "Tailwind + CVA 클래스 규칙",
    owner: "@goraebap/design-system",
  },
  {
    step: "03",
    name: "Headless Primitives",
    role: "Base UI / @spartan-ng/brain",
    owner: "외부 라이브러리",
  },
  {
    step: "04",
    name: "UI Components",
    role: "프레임워크별 스타일드 부품",
    owner: "@goraebap/ui · Angular",
  },
  { step: "05", name: "Patterns", role: "AppShell · 폼 · 쇼케이스 조합", owner: "apps/*" },
];

const SURFACE_TOKENS = [
  { name: "--sidebar", label: "바닥 (Sidebar)", className: "bg-sidebar" },
  { name: "--background", label: "페이지 (Background)", className: "bg-background" },
  { name: "--card", label: "올린 면 (Card)", className: "bg-card" },
  { name: "--popover", label: "뜬 면 (Popover)", className: "bg-popover shadow-md" },
];

const SEMANTIC_TOKENS = [
  { name: "--primary", swatch: "bg-primary text-primary-foreground", sample: "Aa" },
  { name: "--secondary", swatch: "bg-secondary text-secondary-foreground", sample: "Aa" },
  { name: "--muted", swatch: "bg-muted text-muted-foreground", sample: "Aa" },
  { name: "--destructive", swatch: "bg-destructive text-destructive-foreground", sample: "Aa" },
  {
    name: "--border",
    swatch: "bg-background border-2 border-border text-foreground",
    sample: "1px",
  },
  { name: "--input", swatch: "bg-background border-2 border-input text-foreground", sample: "1px" },
];

const BUTTON_VARIANTS: Array<NonNullable<ButtonRecipeProps["variant"]>> = [
  "default",
  "secondary",
  "outline",
  "ghost",
  "destructive",
];

const BUTTON_SIZES: Array<NonNullable<ButtonRecipeProps["size"]>> = ["sm", "default", "lg"];

const BADGE_VARIANTS: Array<NonNullable<BadgeRecipeProps["variant"]>> = [
  "default",
  "secondary",
  "outline",
  "muted",
  "destructive",
];

function UiShowcasePage() {
  const [previewTheme, setPreviewTheme] = useState<"editorial" | "app">("editorial");
  const [btnVariant, setBtnVariant] =
    useState<NonNullable<ButtonRecipeProps["variant"]>>("default");
  const [btnSize, setBtnSize] = useState<NonNullable<ButtonRecipeProps["size"]>>("default");
  const [badgeVariant, setBadgeVariant] =
    useState<NonNullable<BadgeRecipeProps["variant"]>>("secondary");
  const [inputInvalid, setInputInvalid] = useState(false);

  const resolvedButtonClasses = buttonVariants({ variant: btnVariant, size: btnSize });
  const resolvedBadgeClasses = badgeVariants({ variant: badgeVariant });
  const resolvedInputClasses = inputVariants({ size: "default", invalid: inputInvalid });

  return (
    <div className="space-y-16">
      {/* Header & 5-Layer Overview */}
      <section className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl space-y-2">
            <p className="text-blog-accent font-mono text-xs">
              @GORAEBAP/DESIGN-SYSTEM · 5-LAYER ARCHITECTURE
            </p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              디자인 시스템 5계층
            </h1>
            <p className="text-muted-foreground text-[15px] leading-7">
              토큰과 스타일 레시피를 프레임워크 무관 패키지로 분리해, React와 Angular가 같은 디자인
              규격을 공유합니다.
            </p>
          </div>

          <div
            role="tablist"
            aria-label="프리뷰 테마 선택"
            className="border-border bg-secondary/60 inline-flex shrink-0 self-start rounded-md border p-0.5 text-xs"
          >
            <button
              type="button"
              role="tab"
              aria-selected={previewTheme === "editorial"}
              onClick={() => setPreviewTheme("editorial")}
              className={
                previewTheme === "editorial"
                  ? "bg-background text-foreground cursor-pointer rounded px-3 py-1 font-medium shadow-xs"
                  : "text-muted-foreground hover:text-foreground cursor-pointer rounded px-3 py-1"
              }
            >
              Editorial (Blog)
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={previewTheme === "app"}
              onClick={() => setPreviewTheme("app")}
              className={
                previewTheme === "app"
                  ? "bg-background text-foreground cursor-pointer rounded px-3 py-1 font-medium shadow-xs"
                  : "text-muted-foreground hover:text-foreground cursor-pointer rounded px-3 py-1"
              }
            >
              App (Accounts · Productivity)
            </button>
          </div>
        </div>

        <ol className="grid gap-2.5 sm:grid-cols-5">
          {LAYERS.map((layer) => (
            <li
              key={layer.step}
              className="border-border bg-card flex flex-col justify-between gap-2 rounded-lg border p-3.5"
            >
              <div className="space-y-1">
                <span className="text-blog-accent font-mono text-[11px]">{layer.step}</span>
                <div className="text-xs font-semibold">{layer.name}</div>
                <p className="text-muted-foreground text-[11px] leading-4">{layer.role}</p>
              </div>
              <span className="text-muted-foreground font-mono text-[10px]">{layer.owner}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* Scoped Theme Preview Container */}
      <div
        data-ds-theme={previewTheme}
        className="border-border bg-background text-foreground space-y-14 rounded-2xl border p-6 transition-colors sm:p-8"
      >
        {/* Layer 1: Design Tokens */}
        <section className="space-y-6">
          <div className="border-border flex items-baseline justify-between border-b pb-3">
            <div>
              <h2 className="text-base font-semibold tracking-tight">1층 · Design Tokens</h2>
              <p className="text-muted-foreground text-xs">
                현재 선택된 테마: <code className="font-mono">theme-{previewTheme}.css</code>
              </p>
            </div>
            <span className="text-muted-foreground font-mono text-[11px]">CSS Variables</span>
          </div>

          <div className="space-y-2">
            <h3 className="text-muted-foreground text-xs font-medium">4단계 면 위계</h3>
            <div className="grid gap-3 sm:grid-cols-4">
              {SURFACE_TOKENS.map((surface) => (
                <div
                  key={surface.name}
                  className={`${surface.className} border-border flex h-24 flex-col justify-between rounded-xl border p-3.5`}
                >
                  <span className="text-xs font-medium">{surface.label}</span>
                  <code className="text-muted-foreground font-mono text-[11px]">
                    {surface.name}
                  </code>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-muted-foreground text-xs font-medium">의미 토큰</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
              {SEMANTIC_TOKENS.map((token) => (
                <div
                  key={token.name}
                  className="border-border bg-card space-y-2 rounded-lg border p-2.5"
                >
                  <div
                    className={`${token.swatch} flex h-10 items-center justify-center rounded-md font-mono text-xs font-medium`}
                  >
                    {token.sample}
                  </div>
                  <code className="text-muted-foreground block truncate font-mono text-[10px]">
                    {token.name}
                  </code>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Layer 2: Style Recipes (Framework-Agnostic CVA) */}
        <section className="space-y-6">
          <div className="border-border flex items-baseline justify-between border-b pb-3">
            <div>
              <h2 className="text-base font-semibold tracking-tight">
                2층 · Style Recipes (프레임워크 무관)
              </h2>
              <p className="text-muted-foreground text-xs">
                React와 Angular가 동일하게 import하는 순수 TypeScript CVA 함수와 생성 클래스
              </p>
            </div>
            <span className="text-muted-foreground font-mono text-[11px]">Tailwind + CVA</span>
          </div>

          {/* Button recipe inspector */}
          <div className="border-border bg-card overflow-hidden rounded-xl border">
            <div className="bg-dots flex min-h-32 items-center justify-center p-6">
              <button type="button" className={resolvedButtonClasses}>
                buttonVariants({btnVariant}, {btnSize})
              </button>
            </div>
            <div className="border-border bg-secondary/30 space-y-3 border-t p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-muted-foreground mr-1 font-mono text-[11px]">variant</span>
                  {BUTTON_VARIANTS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setBtnVariant(item)}
                      className={
                        btnVariant === item
                          ? "bg-primary text-primary-foreground cursor-pointer rounded px-2 py-0.5 font-mono text-[11px]"
                          : "border-border bg-background text-muted-foreground hover:text-foreground cursor-pointer rounded border px-2 py-0.5 font-mono text-[11px]"
                      }
                    >
                      {item}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground mr-1 font-mono text-[11px]">size</span>
                  {BUTTON_SIZES.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setBtnSize(item)}
                      className={
                        btnSize === item
                          ? "bg-primary text-primary-foreground cursor-pointer rounded px-2 py-0.5 font-mono text-[11px]"
                          : "border-border bg-background text-muted-foreground hover:text-foreground cursor-pointer rounded border px-2 py-0.5 font-mono text-[11px]"
                      }
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>
              <div className="border-border bg-background text-muted-foreground rounded-md border p-3 font-mono text-[11px] leading-5 break-all">
                {resolvedButtonClasses}
              </div>
            </div>
          </div>

          {/* Badge & Input recipes */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="border-border bg-card space-y-4 rounded-xl border p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">badgeVariants</span>
                <span className={resolvedBadgeClasses}>{badgeVariant}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {BADGE_VARIANTS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setBadgeVariant(item)}
                    className={
                      badgeVariant === item
                        ? "bg-primary text-primary-foreground cursor-pointer rounded px-2 py-0.5 font-mono text-[11px]"
                        : "border-border bg-background text-muted-foreground cursor-pointer rounded border px-2 py-0.5 font-mono text-[11px]"
                    }
                  >
                    {item}
                  </button>
                ))}
              </div>
              <div className="border-border bg-background text-muted-foreground rounded border p-2.5 font-mono text-[10px] break-all">
                {resolvedBadgeClasses}
              </div>
            </div>

            <div className="border-border bg-card space-y-4 rounded-xl border p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">inputVariants</span>
                <label className="text-muted-foreground flex cursor-pointer items-center gap-1.5 text-xs">
                  <input
                    type="checkbox"
                    checked={inputInvalid}
                    onChange={(e) => setInputInvalid(e.target.checked)}
                  />
                  <span>invalid</span>
                </label>
              </div>
              <input
                type="text"
                readOnly
                value={inputInvalid ? "올바른 이메일 형식이 아닙니다" : "admin@goraebap.xyz"}
                className={resolvedInputClasses}
              />
              <div className="border-border bg-background text-muted-foreground rounded border p-2.5 font-mono text-[10px] break-all">
                {resolvedInputClasses}
              </div>
            </div>
          </div>
        </section>

        {/* Layer 3-4: UI Components (React live + Angular slot) */}
        <section className="space-y-6">
          <div className="border-border flex items-baseline justify-between border-b pb-3">
            <div>
              <h2 className="text-base font-semibold tracking-tight">
                3~4층 · UI Components (React · Angular)
              </h2>
              <p className="text-muted-foreground text-xs">
                Headless Primitives 위에 같은 레시피를 입힌 프레임워크별 컴포넌트
              </p>
            </div>
            <span className="text-muted-foreground font-mono text-[11px]">Base UI · Brain</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="border-border bg-card space-y-4 rounded-xl border p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">React (@goraebap/ui)</span>
                <Badge variant="outline">Base UI</Badge>
              </div>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant={btnVariant}>
                    Button
                  </Button>
                  <Badge variant={badgeVariant}>Badge</Badge>
                </div>
                <Input placeholder="이메일 입력" invalid={inputInvalid} />
              </div>
            </div>

            <div className="border-border bg-card/50 flex flex-col justify-between space-y-4 rounded-xl border border-dashed p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">Angular (apps/accounts)</span>
                <Badge variant="muted">@spartan-ng/brain</Badge>
              </div>
              <p className="text-muted-foreground text-xs leading-5">
                다음 단계에서 <code className="font-mono">apps/accounts</code>를 Angular로 전환하면
                이 자리에 동일한 <code className="font-mono">@goraebap/design-system</code> 레시피로
                렌더링된 Angular 컴포넌트 프리뷰(iframe)가 나란히 표시됩니다.
              </p>
            </div>
          </div>

          <CopyCommand
            label="CLI"
            command="pnpm dlx shadcn@latest add https://goraebap.xyz/r/button.json"
          />
        </section>
      </div>
    </div>
  );
}
