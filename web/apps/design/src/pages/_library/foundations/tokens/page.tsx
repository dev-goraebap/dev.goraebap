import { useState, type CSSProperties } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Copy } from "lucide-react";
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

const SEGMENT_ON =
  "bg-primary text-primary-foreground cursor-pointer rounded-full px-3.5 py-1.5 font-medium";
const SEGMENT_OFF =
  "text-muted-foreground hover:text-foreground cursor-pointer rounded-full px-3.5 py-1.5";

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
            <Check className="text-foreground size-3.5 shrink-0" />
          ) : (
            <Copy className="text-muted-foreground size-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
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
        <h1 className="text-3xl font-semibold tracking-tight">Design Tokens</h1>
        <p className="text-muted-foreground text-base leading-relaxed">
          패키지의 CSS에서 읽어 온 App(작업 화면용)과 Editorial(긴 글용) 토큰 세트의 Light·Dark 값을
          보여 줍니다. 면 위계는 --sidebar, --background, --card, --popover 순서로 올라가며, 색상
          카드를 누르면 var(--토큰) 형식으로 복사됩니다.
        </p>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="group"
          aria-label="토큰 세트"
          className="border-border bg-card inline-flex flex-wrap items-center rounded-full border p-0.5 text-xs"
        >
          {TOKEN_SETS.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={item.id === tokenSet.id}
              onClick={() => setSetId(item.id)}
              className={item.id === tokenSet.id ? SEGMENT_ON : SEGMENT_OFF}
            >
              {item.name}
            </button>
          ))}
        </div>

        <div
          role="group"
          aria-label="색상 모드"
          className="border-border bg-card inline-flex items-center rounded-full border p-0.5 text-xs"
        >
          {(["light", "dark"] as const).map((item) => (
            <button
              key={item}
              type="button"
              aria-pressed={item === mode}
              onClick={() => setMode(item)}
              className={item === mode ? SEGMENT_ON : SEGMENT_OFF}
            >
              {item === "light" ? "Light" : "Dark"}
            </button>
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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
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
          특정 영역에만 다른 토큰 세트를 쓰려면 요소에 data-ds-theme="app" 또는
          data-ds-theme="editorial"을 지정합니다. 다크 모드는 html 같은 상위 요소의 dark 클래스로
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
