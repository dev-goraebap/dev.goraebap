import { useState, type CSSProperties } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@goraebap/ui-react/components/button";
import { SystemIcon } from "@goraebap/ui-react/icons";
import {
  FONT_FAMILIES,
  RADIUS_SCALE,
  TOKEN_SETS,
  groupColorTokens,
  resolveTokens,
  type TokenMode,
} from "@/entities/design-token";
import { CopyCodeBlock } from "@/shared/ui";

export const Route = createFileRoute("/_library/foundations/tokens/")({
  component: DesignTokensPage,
});

const SURFACE_LEVELS = ["--sidebar", "--background", "--card", "--popover"];

function SurfaceStack({ level = 0 }: { level?: number }) {
  const token = SURFACE_LEVELS[level];
  return (
    <div
      className="border-border space-y-3 rounded-2xl border p-4 sm:p-5"
      style={{ backgroundColor: `var(${token})` }}
    >
      <p className="font-mono text-xs font-medium">{token}</p>
      {level < SURFACE_LEVELS.length - 1 && <SurfaceStack level={level + 1} />}
    </div>
  );
}

function TokenSwatch({ name, value }: { name: string; value: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(`var(${name})`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`${name} 복사`}
      title={value}
      className="border-border bg-card hover:border-foreground/30 group min-w-0 cursor-pointer overflow-hidden rounded-xl border text-left transition-colors"
    >
      <span
        className="border-border block h-16 border-b"
        style={{ backgroundColor: `var(${name})` }}
      />
      <span className="block space-y-0.5 p-3">
        <span className="flex items-center justify-between gap-2">
          <span className="text-foreground truncate font-mono text-xs font-medium">{name}</span>
          {copied ? (
            <SystemIcon name="check" className="text-foreground size-3.5 shrink-0" />
          ) : (
            <SystemIcon
              name="copy"
              className="text-muted-foreground size-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
            />
          )}
        </span>
        <span className="text-muted-foreground block truncate font-mono text-[11px]">{value}</span>
      </span>
    </button>
  );
}

function DesignTokensPage() {
  const [setId, setSetId] = useState(TOKEN_SETS[0].id);
  const [mode, setMode] = useState<TokenMode>(() =>
    document.documentElement.classList.contains("dark") ? "dark" : "light",
  );

  const tokenSet = TOKEN_SETS.find((item) => item.id === setId) ?? TOKEN_SETS[0];
  const values = resolveTokens(tokenSet, mode);
  const groups = groupColorTokens(values);

  return (
    <article className="space-y-8">
      <header className="border-border space-y-3 border-b pb-8">
        <h1 className="text-3xl font-bold tracking-tight">Design Tokens</h1>
        <p className="text-muted-foreground text-base leading-relaxed">
          디자인 토큰은 색상, 반경, 타이포그래피 같은 시각적 결정을 CSS 변수로 정의한 공통
          기준입니다. Neutral을 기본으로 Editorial·Ocean·Forest·Terracotta까지 5가지 색상 테마를
          제공하며, 각 색상 테마는 Light와 Dark 모드를 모두 지원합니다.
        </p>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="group"
          aria-label="토큰 세트"
          className="border-border bg-card inline-flex flex-wrap items-center gap-0.5 rounded-full border p-0.5"
        >
          {TOKEN_SETS.map((item) => (
            <Button
              key={item.id}
              type="button"
              size="sm"
              shape="pill"
              variant={item.id === tokenSet.id ? "default" : "ghost"}
              aria-pressed={item.id === tokenSet.id}
              onClick={() => setSetId(item.id)}
              className="h-7 px-3.5 text-xs"
            >
              {item.name}
            </Button>
          ))}
        </div>

        <div
          role="group"
          aria-label="색상 모드"
          className="border-border bg-card inline-flex items-center gap-0.5 rounded-full border p-0.5"
        >
          {(["light", "dark"] as const).map((item) => (
            <Button
              key={item}
              type="button"
              size="sm"
              shape="pill"
              variant={item === mode ? "default" : "ghost"}
              aria-pressed={item === mode}
              onClick={() => setMode(item)}
              className="h-7 px-3.5 text-xs"
            >
              {item === "light" ? "Light" : "Dark"}
            </Button>
          ))}
        </div>
      </div>

      <div
        style={values as CSSProperties}
        className="border-border bg-background text-foreground space-y-10 rounded-2xl border p-4 sm:p-6"
      >
        <section className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">Surface Hierarchy</h2>
          <SurfaceStack />
        </section>

        {groups.map((group) => (
          <section key={group.title} className="space-y-4">
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-semibold tracking-tight">{group.title}</h2>
              <span className="text-muted-foreground font-mono text-xs">{group.tokens.length}</span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {group.tokens.map((token) => (
                <TokenSwatch key={token.name} name={token.name} value={token.value} />
              ))}
            </div>
          </section>
        ))}

        <section className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">Radius</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {RADIUS_SCALE.map((token) => (
              <div key={token.name} className="min-w-0 space-y-2">
                <div
                  className="border-input bg-card h-20 border-2"
                  style={{ borderRadius: token.value }}
                />
                <p className="truncate font-mono text-xs font-medium">{token.name}</p>
                <p className="text-muted-foreground truncate font-mono text-[11px]">
                  {token.value}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold tracking-tight">Typography</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {FONT_FAMILIES.map((token) => (
              <div
                key={token.name}
                className="border-border bg-card min-w-0 space-y-2 rounded-xl border p-4"
              >
                <p className="truncate text-2xl" style={{ fontFamily: token.value }}>
                  Aa 가나다 123
                </p>
                <p className="font-mono text-xs font-medium">{token.name}</p>
                <p
                  className="text-muted-foreground truncate font-mono text-[11px]"
                  title={token.value}
                >
                  {token.value}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">토큰 세트 적용</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          특정 영역에 토큰 세트를 지정하려면 요소에 data-ds-theme="app" 또는
          data-ds-theme="editorial"을 추가합니다. 다크 모드는 html 같은 상위 요소의 dark 클래스로
          전환합니다.
        </p>
        <CopyCodeBlock
          label={tokenSet.source}
          language="html"
          code={`<section data-ds-theme="${tokenSet.id}">...</section>`}
        />
      </section>
    </article>
  );
}
