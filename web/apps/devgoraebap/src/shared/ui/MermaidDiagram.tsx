import { useEffect, useId, useRef, useState } from "react";
import { toHexColor } from "../lib/css-color";

const THEME_ATTRIBUTES = ["class", "data-ds-theme", "style"];

// mermaid는 설정이 전역이라 여러 그림이 동시에 그려지지 않도록 차례로 그린다.
let queue = Promise.resolve();

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
      edgeLabelBackground: color("--background"),
      fontSize: "14px",
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

export function MermaidDiagram({ code, caption }: { code: string; caption: string }) {
  const id = useId().replace(/[^\w-]/g, "");
  const themeKey = useThemeKey();
  const renders = useRef(0);
  const [svg, setSvg] = useState<string>();
  const [failed, setFailed] = useState(false);

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

  return (
    <figure className="border-border bg-card space-y-3 rounded-xl border p-4 sm:p-6">
      {failed ? (
        <pre className="text-muted-foreground overflow-x-auto font-mono text-xs">{code}</pre>
      ) : svg ? (
        <div
          role="img"
          aria-label={caption}
          className="overflow-x-auto motion-safe:animate-[page-state-enter_320ms_cubic-bezier(0.2,0,0,1)_both] [&_svg]:mx-auto [&_svg]:h-auto [&_svg]:max-w-none"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : (
        <div aria-hidden="true" className="bg-muted/60 h-40 animate-pulse rounded-lg" />
      )}
      <figcaption className="text-muted-foreground text-center text-sm">{caption}</figcaption>
    </figure>
  );
}
