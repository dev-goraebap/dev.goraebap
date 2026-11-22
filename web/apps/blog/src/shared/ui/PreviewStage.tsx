import { useState, type ReactNode } from "react";

interface PreviewStageProps {
  title?: string;
  code: string;
  mobileNote?: string;
  children: (ctx: { isMobile: boolean; theme: "editorial" | "app" }) => ReactNode;
}

export function PreviewStage({ title, code, mobileNote, children }: PreviewStageProps) {
  const [tab, setTab] = useState<"preview" | "code">("preview");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [theme, setTheme] = useState<"editorial" | "app">("app");
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="border-border bg-card overflow-hidden rounded-xl border">
      <div className="border-border bg-secondary/40 flex flex-wrap items-center justify-between gap-2 border-b px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="border-border bg-background inline-flex rounded-md border p-0.5 text-xs">
            <button
              type="button"
              onClick={() => setTab("preview")}
              className={
                tab === "preview"
                  ? "bg-primary text-primary-foreground cursor-pointer rounded px-2.5 py-0.5 font-medium"
                  : "text-muted-foreground hover:text-foreground cursor-pointer rounded px-2.5 py-0.5"
              }
            >
              미리보기
            </button>
            <button
              type="button"
              onClick={() => setTab("code")}
              className={
                tab === "code"
                  ? "bg-primary text-primary-foreground cursor-pointer rounded px-2.5 py-0.5 font-medium"
                  : "text-muted-foreground hover:text-foreground cursor-pointer rounded px-2.5 py-0.5"
              }
            >
              코드
            </button>
          </div>
          {title ? (
            <span className="text-muted-foreground hidden font-mono text-[11px] sm:inline">
              {title}
            </span>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {tab === "preview" ? (
            <>
              <div className="border-border bg-background inline-flex rounded-md border p-0.5 font-mono text-[11px]">
                <button
                  type="button"
                  onClick={() => setDevice("desktop")}
                  className={
                    device === "desktop"
                      ? "bg-secondary text-foreground cursor-pointer rounded px-2 py-0.5 font-medium"
                      : "text-muted-foreground hover:text-foreground cursor-pointer rounded px-2 py-0.5"
                  }
                >
                  Desktop
                </button>
                <button
                  type="button"
                  onClick={() => setDevice("mobile")}
                  className={
                    device === "mobile"
                      ? "bg-secondary text-foreground cursor-pointer rounded px-2 py-0.5 font-medium"
                      : "text-muted-foreground hover:text-foreground cursor-pointer rounded px-2 py-0.5"
                  }
                >
                  Mobile 390px
                </button>
              </div>
              <div className="border-border bg-background inline-flex rounded-md border p-0.5 font-mono text-[11px]">
                <button
                  type="button"
                  onClick={() => setTheme("app")}
                  className={
                    theme === "app"
                      ? "bg-secondary text-foreground cursor-pointer rounded px-2 py-0.5 font-medium"
                      : "text-muted-foreground hover:text-foreground cursor-pointer rounded px-2 py-0.5"
                  }
                >
                  App
                </button>
                <button
                  type="button"
                  onClick={() => setTheme("editorial")}
                  className={
                    theme === "editorial"
                      ? "bg-secondary text-foreground cursor-pointer rounded px-2 py-0.5 font-medium"
                      : "text-muted-foreground hover:text-foreground cursor-pointer rounded px-2 py-0.5"
                  }
                >
                  Editorial
                </button>
              </div>
            </>
          ) : (
            <button
              type="button"
              onClick={() => void handleCopy()}
              className="border-border bg-background text-muted-foreground hover:text-foreground cursor-pointer rounded-md border px-2.5 py-1 text-xs font-medium"
            >
              {copied ? "복사됨" : "코드 복사"}
            </button>
          )}
        </div>
      </div>

      {tab === "preview" ? (
        <div
          data-ds-theme={theme}
          className="bg-dots flex min-h-56 flex-col items-center justify-center p-6 transition-colors sm:p-8"
        >
          {device === "mobile" ? (
            <div className="border-border bg-background text-foreground w-full max-w-[390px] overflow-hidden rounded-[24px] border-2 shadow-md">
              <div className="border-border bg-sidebar text-muted-foreground flex items-center justify-between border-b px-4 py-1.5 font-mono text-[10px]">
                <span>9:41</span>
                <span>390 × Mobile</span>
              </div>
              <div className="p-4">{children({ isMobile: true, theme })}</div>
            </div>
          ) : (
            <div className="w-full">{children({ isMobile: false, theme })}</div>
          )}
          {device === "mobile" && mobileNote ? (
            <p className="text-muted-foreground mt-3 text-center text-xs">{mobileNote}</p>
          ) : null}
        </div>
      ) : (
        <pre className="bg-secondary/40 text-foreground overflow-x-auto p-5 font-mono text-xs leading-6">
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
}
