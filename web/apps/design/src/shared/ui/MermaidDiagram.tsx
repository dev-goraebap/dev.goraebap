import { useEffect, useId, useState } from "react";
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

function useThemeVersion() {
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const observer = new MutationObserver(() => setVersion((value) => value + 1));
    observer.observe(document.documentElement, { attributeFilter: THEME_ATTRIBUTES });
    return () => observer.disconnect();
  }, []);
  return version;
}

export function MermaidDiagram({ code, caption }: { code: string; caption: string }) {
  const id = useId().replace(/[^\w-]/g, "");
  const themeVersion = useThemeVersion();
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
          fontFamily: theme.fontFamily,
          themeVariables: theme.themeVariables,
        });
        const result = await mermaid.render(`mermaid-${id}-${themeVersion}`, code);
        if (!cancelled) setSvg(result.svg);
      } catch {
        if (!cancelled) setFailed(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [code, id, themeVersion]);

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
