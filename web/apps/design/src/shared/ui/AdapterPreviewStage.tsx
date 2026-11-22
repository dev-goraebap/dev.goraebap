import { useState, type ReactNode } from "react";
import { Button } from "@goraebap/ui-react/components/button";
import { SystemIcon } from "@goraebap/ui-react/icons";
import { useDesignConfig } from "../lib/design-config";
import { detectAngularLanguage } from "../lib/highlight";
import { CodeView } from "./CodeView";
import { MobileDeviceFrame } from "./MobileDeviceFrame";
import { ThemedPortalScope } from "./ThemedPortalScope";

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
  const { config } = useDesignConfig();
  const theme = config.theme;
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
    <ThemedPortalScope theme={theme}>
      <div className="border-border bg-card overflow-hidden rounded-2xl border">
        {/* Top Adapter + Controls Bar */}
        <div className="border-border bg-muted/35 flex flex-wrap items-center justify-between gap-3 border-b px-4 py-2.5">
          {/* Adapter Switcher */}
          <div
            className="border-border bg-background inline-flex items-center gap-0.5 rounded-full border p-0.5"
            role="tablist"
            aria-label="어댑터 선택"
          >
            {(
              [
                { id: "html", label: "Vanilla HTML/TS" },
                { id: "react", label: "React (Base UI)" },
                { id: "angular", label: "Angular (Spartan)" },
              ] as const
            ).map((item) => (
              <Button
                key={item.id}
                type="button"
                role="tab"
                size="sm"
                shape="pill"
                variant={adapter === item.id ? "default" : "ghost"}
                aria-selected={adapter === item.id}
                onClick={() => setAdapter(item.id)}
                className="h-7 px-3 text-xs"
              >
                {item.label}
              </Button>
            ))}
          </div>

          {/* Right Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {view === "preview" && adapter !== "angular" && (
              <div
                className="border-border bg-background inline-flex items-center gap-0.5 rounded-full border p-0.5"
                role="group"
                aria-label="뷰포트 전환"
              >
                <Button
                  type="button"
                  size="sm"
                  shape="pill"
                  variant={viewport === "desktop" ? "secondary" : "ghost"}
                  aria-pressed={viewport === "desktop"}
                  onClick={() => setViewport("desktop")}
                  className="h-7 gap-1 px-2.5 text-xs"
                >
                  <SystemIcon name="desktop" className="size-3.5" />
                  <span>Desktop</span>
                </Button>
                <Button
                  type="button"
                  size="sm"
                  shape="pill"
                  variant={viewport === "mobile" ? "secondary" : "ghost"}
                  aria-pressed={viewport === "mobile"}
                  onClick={() => setViewport("mobile")}
                  className="h-7 gap-1 px-2.5 text-xs"
                >
                  <SystemIcon name="mobile" className="size-3.5" />
                  <span>390px</span>
                </Button>
              </div>
            )}

            <div
              className="border-border bg-background inline-flex items-center gap-0.5 rounded-full border p-0.5"
              role="group"
              aria-label="보기 전환"
            >
              <Button
                type="button"
                size="sm"
                shape="pill"
                variant={view === "preview" ? "secondary" : "ghost"}
                aria-pressed={view === "preview"}
                onClick={() => setView("preview")}
                className="h-7 gap-1 px-2.5 text-xs"
              >
                <SystemIcon name="eye" className="size-3.5" />
                <span>Preview</span>
              </Button>
              <Button
                type="button"
                size="sm"
                shape="pill"
                variant={view === "code" ? "secondary" : "ghost"}
                aria-pressed={view === "code"}
                onClick={() => setView("code")}
                className="h-7 gap-1 px-2.5 text-xs"
              >
                <SystemIcon name="code" className="size-3.5" />
                <span>Code</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Stage Body */}
        {view === "preview" ? (
          <div
            data-ds-theme={theme}
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
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleCopy}
                    className="text-muted-foreground hover:text-foreground h-7 gap-1 px-2 text-xs"
                  >
                    <SystemIcon name={copied ? "check" : "copy"} className="size-3.5" />
                    <span>{copied ? "복사됨" : "코드 복사"}</span>
                  </Button>
                </div>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  {angularNote ??
                    "Angular에서는 @spartan-ng/brain 헤드리스 디렉티브 위에 React·Vanilla HTML/TS와 완전히 같은 @goraebap/design-system CVA 레시피를 그대로 결합합니다."}
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
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="bg-card text-muted-foreground hover:text-foreground absolute top-3 right-3 h-7 gap-1.5 px-2.5 text-xs"
            >
              <SystemIcon name={copied ? "check" : "copy"} className="size-3.5" />
              <span>{copied ? "복사됨" : "복사"}</span>
            </Button>
            <CodeView
              code={activeCode}
              language={activeLang}
              className="text-foreground max-h-[30rem] overflow-auto p-5 font-mono text-xs leading-relaxed"
            />
          </div>
        )}
      </div>
    </ThemedPortalScope>
  );
}
