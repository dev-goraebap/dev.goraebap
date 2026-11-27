import { useEffect, useId, useRef, useState } from "react";
import { toHexColor } from "../lib/css-color";

const THEME_ATTRIBUTES = ["class", "data-ds-theme", "style"];

// mermaid는 설정이 전역이라 여러 그림이 동시에 그려지지 않도록 차례로 그린다.
let queue = Promise.resolve();

function extractCaption(code: string): string | undefined {
  for (const line of code.replace(/\r\n/g, "\n").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const match = /^%%\s*caption:\s*(.+)$/i.exec(trimmed);
    if (match) return match[1].trim();
    if (!trimmed.startsWith("%%")) break;
  }
  return undefined;
}

function readTheme() {
  const style = getComputedStyle(document.documentElement);
  const color = (name: string) => toHexColor(style.getPropertyValue(name).trim());
  return {
    fontFamily: style.getPropertyValue("--font-sans").trim(),
    themeVariables: {
      background: color("--background"),
      primaryColor: color("--card"),
      primaryTextColor: color("--foreground"),
      primaryBorderColor: color("--muted-foreground"),
      secondaryColor: color("--muted"),
      tertiaryColor: color("--secondary"),
      lineColor: color("--muted-foreground"),
      textColor: color("--foreground"),
      clusterBkg: color("--muted"),
      clusterBorder: color("--border"),
      edgeLabelBackground: color("--card"),
      fontSize: "13.5px",
    },
  };
}

// 스크롤 라이브러리도 html 클래스를 바꾸므로, 실제로 쓰는 색과 글꼴이 달라졌을 때만 다시 그린다.
function useThemeKey() {
  // 정적 페이지를 만드는 서버에는 계산된 스타일이 없어 빈 키로 시작한다.
  const [key, setKey] = useState(() =>
    typeof document === "undefined" ? "" : JSON.stringify(readTheme()),
  );
  useEffect(() => {
    const observer = new MutationObserver(() => setKey(JSON.stringify(readTheme())));
    observer.observe(document.documentElement, { attributeFilter: THEME_ATTRIBUTES });
    return () => observer.disconnect();
  }, []);
  return key;
}

export function MermaidDiagram({ code, caption }: { code: string; caption?: string }) {
  const id = useId().replace(/[^\w-]/g, "");
  const themeKey = useThemeKey();
  const renders = useRef(0);
  const [svg, setSvg] = useState<string>();
  const [failed, setFailed] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const resolvedCaption = caption ?? extractCaption(code);

  useEffect(() => {
    let cancelled = false;
    queue = queue.then(async () => {
      if (cancelled) return;
      try {
        const { default: mermaid } = await import("mermaid");
        const theme = readTheme();
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: "strict",
          theme: "base",
          look: "handDrawn",
          // 손그림 선이 그릴 때마다 달라지지 않도록 흔들림을 고정한다.
          handDrawnSeed: 1,
          fontFamily: theme.fontFamily,
          themeVariables: theme.themeVariables,
          flowchart: {
            padding: 16,
            nodeSpacing: 44,
            rankSpacing: 52,
            curve: "basis",
            htmlLabels: true,
          },
          sequence: {
            mirrorActors: false,
            messageMargin: 36,
          },
        });
        renders.current += 1;
        const result = await mermaid.render(`mermaid-${id}-${renders.current}`, code);
        if (!cancelled) setSvg(result.svg);
      } catch {
        if (!cancelled) setFailed(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [code, id, themeKey]);

  useEffect(() => {
    if (!expanded) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setExpanded(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [expanded]);

  return (
    <>
      <figure className="border-border bg-card overflow-hidden rounded-2xl border">
        <div className="bg-dots bg-background/70 relative p-4 sm:p-6">
          {svg && (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              aria-label="다이어그램 크게 보기"
              className="border-border bg-card/90 text-muted-foreground hover:text-foreground absolute top-3 right-3 z-10 rounded-full border px-2.5 py-1 text-[0.6875rem] font-medium backdrop-blur-xs transition-colors"
            >
              크게 보기
            </button>
          )}
          {failed ? (
            <pre className="text-muted-foreground overflow-x-auto font-mono text-xs">{code}</pre>
          ) : svg ? (
            <div
              role="img"
              aria-label={resolvedCaption ?? "다이어그램"}
              className="overflow-x-auto pt-4 motion-safe:animate-[page-state-enter_320ms_cubic-bezier(0.2,0,0,1)_both] [&_svg]:mx-auto [&_svg]:h-auto [&_svg]:max-w-full"
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          ) : (
            <div aria-hidden="true" className="bg-muted/60 h-40 animate-pulse rounded-lg" />
          )}
        </div>
        {resolvedCaption && (
          <figcaption className="border-border/80 text-muted-foreground border-t px-4 py-2.5 text-center text-xs break-keep">
            {resolvedCaption}
          </figcaption>
        )}
      </figure>

      {expanded && svg && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={resolvedCaption ?? "다이어그램 확대 보기"}
          onClick={() => setExpanded(false)}
          className="bg-background/85 fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm sm:p-8"
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="border-border bg-card flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border shadow-xl"
          >
            <div className="border-border flex items-center justify-between gap-4 border-b px-5 py-3">
              <p className="text-foreground text-sm font-medium break-keep">
                {resolvedCaption ?? "다이어그램"}
              </p>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="border-border text-muted-foreground hover:text-foreground rounded-full border px-3 py-1 text-xs font-medium transition-colors"
              >
                닫기 (Esc)
              </button>
            </div>
            <div
              className="bg-dots bg-background/70 flex-1 overflow-auto p-6 sm:p-10 [&_svg]:mx-auto [&_svg]:h-auto [&_svg]:min-w-[min(100%,42rem)]"
              dangerouslySetInnerHTML={{ __html: svg }}
            />
          </div>
        </div>
      )}
    </>
  );
}
