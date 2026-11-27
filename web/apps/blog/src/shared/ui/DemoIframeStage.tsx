import { useCallback, useEffect, useRef, useState } from "react";
import { SystemIcon } from "@goraebap/ui-react/icons";
import { useDesignConfig } from "@/shared/lib/design-config";

export const LIVE_DEMO_SLUGS = new Set([
  "button",
  "alert",
  "avatar",
  "badge",
  "card",
  "separator",
  "skeleton",
  "input",
  "textarea",
  "otp-field",
  "dialog",
  "menu",
]);

const OVERLAY_SLUGS = new Set(["dialog", "menu"]);

interface DemoIframeStageProps {
  slug: string;
  framework: "react" | "angular";
}

function buildDemoUrl(
  slug: string,
  framework: "react" | "angular",
  params: {
    theme: string;
    dark: boolean;
    radius: string;
    cornerShape: string;
    uiSize: string;
    iconSet: string;
  },
) {
  const base = framework === "angular" ? "/demos/angular/" : "/demos/react/";
  const search = new URLSearchParams({
    demo: slug,
    theme: params.theme,
    dark: params.dark ? "1" : "0",
    radius: params.radius,
    cornerShape: params.cornerShape,
    uiSize: params.uiSize,
    iconSet: params.iconSet,
  });
  return `${base}?${search.toString()}`;
}

function DemoIframeInner({ slug, framework }: DemoIframeStageProps) {
  const { config } = useDesignConfig();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const minHeight = OVERLAY_SLUGS.has(slug) ? 360 : 240;
  const [height, setHeight] = useState(minHeight);
  const [ready, setReady] = useState(false);

  // 초기 URL은 마운트 시 고정하고, 이후 테마 변경은 postMessage로 실시간 동기화한다.
  const [src] = useState(() =>
    buildDemoUrl(slug, framework, {
      theme: config.theme,
      dark:
        typeof document !== "undefined" && document.documentElement.classList.contains("dark"),
      radius: config.radius,
      cornerShape: config.cornerShape,
      uiSize: config.uiSize,
      iconSet: config.iconSet,
    }),
  );

  const syncDesign = useCallback(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win || typeof document === "undefined") return;
    const rootStyle = getComputedStyle(document.documentElement);
    win.postMessage(
      {
        type: "gb:design-config",
        payload: {
          theme: config.theme,
          dark: document.documentElement.classList.contains("dark"),
          radius: config.radius,
          cornerShape: config.cornerShape,
          uiSize: config.uiSize,
          fontSans: rootStyle.getPropertyValue("--font-sans").trim() || undefined,
          fontHeading: rootStyle.getPropertyValue("--font-heading").trim() || undefined,
          iconSet: config.iconSet,
        },
      },
      "*",
    );
  }, [config]);

  useEffect(() => {
    syncDesign();
  }, [syncDesign]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const observer = new MutationObserver(() => syncDesign());
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-ds-theme", "style"],
    });
    return () => observer.disconnect();
  }, [syncDesign]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      const data = event.data as { type?: string; height?: number } | null;
      if (!data) return;
      if (data.type === "gb:demo-ready") {
        setReady(true);
        syncDesign();
      } else if (data.type === "gb:demo-height" && typeof data.height === "number") {
        setHeight(Math.max(minHeight, data.height));
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [minHeight, syncDesign]);

  const label = framework === "angular" ? "Angular 라이브 데모" : "React · TanStack 라이브 데모";

  return (
    <div className="bg-dots bg-background/70 relative w-full">
      <div className="border-border/70 bg-card/80 flex items-center justify-between gap-2 border-b px-4 py-2 text-xs">
        <span className="text-muted-foreground flex items-center gap-2 font-medium">
          <span
            aria-hidden="true"
            className={`size-2 rounded-full ${ready ? "bg-emerald-500" : "bg-muted-foreground/40"}`}
          />
          {label}
        </span>
        <a
          href={src}
          target="_blank"
          rel="noreferrer"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
        >
          새 탭에서 열기
          <SystemIcon name="arrowRight" className="size-3" />
        </a>
      </div>
      <iframe
        ref={iframeRef}
        src={src}
        title={`${slug} ${label}`}
        loading="lazy"
        style={{ height: `${height}px` }}
        className="block w-full border-0 bg-transparent transition-[height] duration-150"
      />
    </div>
  );
}

export function DemoIframeStage({ slug, framework }: DemoIframeStageProps) {
  return <DemoIframeInner key={`${framework}:${slug}`} slug={slug} framework={framework} />;
}
