import { useState, type ReactNode } from "react";
import { Check, Code2, Copy, Eye, Monitor, Smartphone } from "lucide-react";
import { detectAngularLanguage } from "../lib/highlight";
import { CodeView } from "./CodeView";
import { MobileDeviceFrame } from "./MobileDeviceFrame";

export type AdapterTarget = "html" | "react" | "angular";

interface AdapterPreviewStageProps {
  slug?: string;
  title?: string;
  htmlCode: string;
  reactCode: string;
  angularCode: string;
  renderHtml: (ctx: { isMobile: boolean }) => ReactNode;
  renderReact: (ctx: { isMobile: boolean }) => ReactNode;
  angularNote?: string;
  defaultAdapter?: AdapterTarget;
}

export function AdapterPreviewStage({
  slug,
  title,
  htmlCode,
  reactCode,
  angularCode,
  renderHtml,
  renderReact,
  angularNote,
  defaultAdapter = "html",
}: AdapterPreviewStageProps) {
  const [adapter, setAdapter] = useState<AdapterTarget>(defaultAdapter);
  const [view, setView] = useState<"preview" | "code">("preview");
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");
  const [theme, setTheme] = useState<"app" | "editorial">("app");
  const [copied, setCopied] = useState(false);

  const isMobile = viewport === "mobile";
  const activeCode = adapter === "html" ? htmlCode : adapter === "react" ? reactCode : angularCode;
  const angularLang = detectAngularLanguage(angularCode);
  const activeLang = adapter === "html" ? "html" : adapter === "react" ? "tsx" : angularLang;

  async function handleCopy() {
    await navigator.clipboard.writeText(activeCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="border-border bg-card overflow-hidden rounded-2xl border">
      {/* Top Adapter + Controls Bar */}
      <div className="border-border bg-muted/35 flex flex-wrap items-center justify-between gap-3 border-b px-4 py-2.5">
        {/* Adapter Switcher */}
        <div
          className="border-border bg-background inline-flex items-center rounded-full border p-0.5 text-xs"
          role="tablist"
          aria-label="어댑터 선택"
        >
          {(
            [
              { id: "html", label: "Pure HTML" },
              { id: "react", label: "React (Base UI)" },
              { id: "angular", label: "Angular (Spartan)" },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={adapter === item.id}
              onClick={() => setAdapter(item.id)}
              className={
                adapter === item.id
                  ? "bg-primary text-primary-foreground cursor-pointer rounded-full px-3 py-1 font-medium transition-colors"
                  : "text-muted-foreground hover:text-foreground cursor-pointer rounded-full px-3 py-1 transition-colors"
              }
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Right Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {view === "preview" && adapter !== "angular" && (
            <>
              <div
                className="border-border bg-background inline-flex items-center rounded-full border p-0.5 text-xs"
                role="group"
                aria-label="뷰포트 전환"
              >
                <button
                  type="button"
                  onClick={() => setViewport("desktop")}
                  className={
                    viewport === "desktop"
                      ? "bg-secondary text-foreground inline-flex cursor-pointer items-center gap-1 rounded-full px-2.5 py-1 font-medium"
                      : "text-muted-foreground hover:text-foreground inline-flex cursor-pointer items-center gap-1 rounded-full px-2.5 py-1"
                  }
                >
                  <Monitor className="size-3.5" />
                  <span>Desktop</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewport("mobile")}
                  className={
                    viewport === "mobile"
                      ? "bg-secondary text-foreground inline-flex cursor-pointer items-center gap-1 rounded-full px-2.5 py-1 font-medium"
                      : "text-muted-foreground hover:text-foreground inline-flex cursor-pointer items-center gap-1 rounded-full px-2.5 py-1"
                  }
                >
                  <Smartphone className="size-3.5" />
                  <span>390px</span>
                </button>
              </div>

              <div
                className="border-border bg-background inline-flex items-center rounded-full border p-0.5 text-xs"
                role="group"
                aria-label="테마 전환"
              >
                <button
                  type="button"
                  onClick={() => setTheme("app")}
                  className={
                    theme === "app"
                      ? "bg-secondary text-foreground cursor-pointer rounded-full px-2.5 py-1 font-medium"
                      : "text-muted-foreground hover:text-foreground cursor-pointer rounded-full px-2.5 py-1"
                  }
                >
                  App
                </button>
                <button
                  type="button"
                  onClick={() => setTheme("editorial")}
                  className={
                    theme === "editorial"
                      ? "bg-secondary text-foreground cursor-pointer rounded-full px-2.5 py-1 font-medium"
                      : "text-muted-foreground hover:text-foreground cursor-pointer rounded-full px-2.5 py-1"
                  }
                >
                  Editorial
                </button>
              </div>
            </>
          )}

          <div className="border-border bg-background inline-flex items-center rounded-full border p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setView("preview")}
              className={
                view === "preview"
                  ? "bg-secondary text-foreground inline-flex cursor-pointer items-center gap-1 rounded-full px-2.5 py-1 font-medium"
                  : "text-muted-foreground hover:text-foreground inline-flex cursor-pointer items-center gap-1 rounded-full px-2.5 py-1"
              }
            >
              <Eye className="size-3.5" />
              <span>Preview</span>
            </button>
            <button
              type="button"
              onClick={() => setView("code")}
              className={
                view === "code"
                  ? "bg-secondary text-foreground inline-flex cursor-pointer items-center gap-1 rounded-full px-2.5 py-1 font-medium"
                  : "text-muted-foreground hover:text-foreground inline-flex cursor-pointer items-center gap-1 rounded-full px-2.5 py-1"
              }
            >
              <Code2 className="size-3.5" />
              <span>Code</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stage Body */}
      {view === "preview" ? (
        <div
          data-theme={theme}
          className={`bg-dots bg-background/70 flex min-h-72 flex-col items-center justify-center transition-colors ${
            isMobile && adapter !== "angular" ? "px-4 py-10 sm:px-8" : "p-6"
          }`}
        >
          {adapter === "angular" ? (
            <div className="border-border bg-card w-full max-w-2xl space-y-4 rounded-xl border p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="bg-info/15 text-info border-info/30 rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-medium">
                    @spartan-ng/brain + @goraebap/design-system
                  </span>
                  <span className="text-muted-foreground font-mono text-xs">
                    Live iframe 예정 (apps/accounts 전환 시 연결)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="text-muted-foreground hover:bg-accent hover:text-foreground inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs"
                >
                  {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                  <span>{copied ? "복사됨" : "코드 복사"}</span>
                </button>
              </div>
              <p className="text-muted-foreground text-xs leading-relaxed">
                {angularNote ??
                  "Angular에서는 @spartan-ng/brain 헤드리스 디렉티브 위에 React·Pure HTML과 완전히 같은 @goraebap/design-system CVA 레시피를 그대로 결합합니다."}
              </p>
              <CodeView
                code={angularCode}
                language={angularLang}
                className="border-border bg-background text-foreground overflow-x-auto rounded-lg border p-4 font-mono text-xs leading-relaxed"
              />
            </div>
          ) : isMobile && slug ? (
            <MobileDeviceFrame
              path={`/preview/components/${slug}`}
              title={title}
              adapter={adapter}
              theme={theme}
            />
          ) : (
            <div className="text-foreground w-full max-w-2xl">
              {adapter === "html" ? renderHtml({ isMobile }) : renderReact({ isMobile })}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-background relative">
          <button
            type="button"
            onClick={handleCopy}
            className="border-border bg-card text-muted-foreground hover:text-foreground absolute top-3 right-3 inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors"
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            <span>{copied ? "복사됨" : "복사"}</span>
          </button>
          <CodeView
            code={activeCode}
            language={activeLang}
            className="text-foreground overflow-x-auto p-5 pr-20 font-mono text-xs leading-relaxed"
          />
        </div>
      )}
    </div>
  );
}
