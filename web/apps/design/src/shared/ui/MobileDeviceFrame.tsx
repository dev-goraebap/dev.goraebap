import { useCallback, useEffect, useRef, useState } from "react";
import { ExternalLink } from "lucide-react";
import {
  PREVIEW_SYNC_TYPE,
  type PreviewAdapter,
  type PreviewSyncPayload,
  type PreviewTheme,
} from "../lib/preview-sync";

interface MobileDeviceFrameProps {
  /** 프리뷰 라우트 경로 (예: /preview/components/dialog) */
  path: string;
  title?: string;
  adapter?: PreviewAdapter;
  theme?: PreviewTheme;
}

function buildPreviewUrl(path: string, adapter?: PreviewAdapter, theme?: PreviewTheme): string {
  const params = new URLSearchParams();
  if (adapter) params.set("adapter", adapter);
  if (theme) params.set("theme", theme);
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

export function MobileDeviceFrame({
  path,
  title = "Mobile Preview",
  adapter,
  theme = "app",
}: MobileDeviceFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loadedPath, setLoadedPath] = useState<string | null>(null);
  // path가 바뀔 때만 iframe src를 재구성하고, adapter/theme/dark 전환은 postMessage로 무깜빡임 동기화한다.
  const [frameTarget, setFrameTarget] = useState(() => ({
    path,
    src: buildPreviewUrl(path, adapter, theme),
  }));

  if (frameTarget.path !== path) {
    setFrameTarget({ path, src: buildPreviewUrl(path, adapter, theme) });
  }

  const syncToIframe = useCallback(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    const payload: PreviewSyncPayload = {
      type: PREVIEW_SYNC_TYPE,
      adapter,
      theme,
      dark: document.documentElement.classList.contains("dark"),
    };
    win.postMessage(payload, window.location.origin);
  }, [adapter, theme]);

  useEffect(() => {
    syncToIframe();
  }, [syncToIframe]);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      syncToIframe();
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, [syncToIframe]);

  const isLoaded = loadedPath === path;
  const externalUrl = buildPreviewUrl(path, adapter, theme);

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Smartphone Hardware Chassis */}
      <div className="relative max-w-full">
        {/* Left hardware buttons (Action + Volume Up/Down) */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-24 -left-[3px] hidden h-7 w-[3px] rounded-l-sm bg-zinc-400 sm:block dark:bg-zinc-600"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-36 -left-[3px] hidden h-12 w-[3px] rounded-l-sm bg-zinc-400 sm:block dark:bg-zinc-600"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-52 -left-[3px] hidden h-12 w-[3px] rounded-l-sm bg-zinc-400 sm:block dark:bg-zinc-600"
        />
        {/* Right hardware button (Power) */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-40 -right-[3px] hidden h-16 w-[3px] rounded-r-sm bg-zinc-400 sm:block dark:bg-zinc-600"
        />

        {/* Outer metallic frame */}
        <div className="rounded-[3.25rem] bg-gradient-to-b from-zinc-800 via-zinc-900 to-zinc-800 p-[10px] shadow-[0_28px_70px_-20px_rgba(0,0,0,0.55),0_8px_24px_-8px_rgba(0,0,0,0.28)] ring-1 ring-black/20 dark:from-zinc-700 dark:via-zinc-800 dark:to-zinc-900 dark:ring-white/15">
          {/* Inner black glass bezel */}
          <div className="rounded-[2.65rem] bg-black p-[4px]">
            {/* Actual 390 x 740 Mobile Screen Viewport */}
            <div className="bg-background relative h-[740px] w-[390px] max-w-[calc(100vw-4rem)] overflow-hidden rounded-[2.4rem]">
              {/* Real isolated iframe viewport */}
              <iframe
                ref={iframeRef}
                src={frameTarget.src}
                title={`${title} — 390px 모바일 프리뷰`}
                onLoad={() => {
                  setLoadedPath(path);
                  syncToIframe();
                }}
                className={`h-full w-full border-0 transition-opacity duration-150 ${
                  isLoaded ? "opacity-100" : "opacity-0"
                }`}
              />

              {/* iOS Status Bar + Dynamic Island Overlay (pointer-events-none so backdrop/scroll passes through) */}
              <div
                aria-hidden="true"
                className="text-foreground pointer-events-none absolute inset-x-0 top-0 z-20 flex h-12 items-center justify-between px-7 pt-1 select-none"
              >
                <span className="text-[13px] font-semibold tracking-tight tabular-nums">9:41</span>

                {/* Dynamic Island */}
                <div className="flex h-[24px] w-[96px] items-center justify-end rounded-full bg-black pr-2.5 shadow-inner ring-1 ring-white/10">
                  <span className="size-2.5 rounded-full bg-zinc-900 ring-1 ring-indigo-950/90" />
                </div>

                {/* Signal + Wi-Fi + Battery SVG */}
                <div className="flex items-center gap-1.5">
                  {/* Cellular Signal Bars */}
                  <svg className="h-3 w-4" viewBox="0 0 18 12" fill="currentColor">
                    <rect x="0" y="8" width="3" height="4" rx="0.8" />
                    <rect x="4.5" y="5.5" width="3" height="6.5" rx="0.8" />
                    <rect x="9" y="3" width="3" height="9" rx="0.8" />
                    <rect x="13.5" y="0.5" width="3" height="11.5" rx="0.8" />
                  </svg>
                  {/* Wi-Fi */}
                  <svg
                    className="h-3 w-3.5"
                    viewBox="0 0 16 12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  >
                    <path d="M1.5 4.2a9.8 9.8 0 0 1 13 0" />
                    <path d="M4.2 7a6.2 6.2 0 0 1 7.6 0" />
                    <circle cx="8" cy="10.2" r="1.1" fill="currentColor" stroke="none" />
                  </svg>
                  {/* Battery */}
                  <svg className="h-3 w-6" viewBox="0 0 25 12" fill="none">
                    <rect
                      x="0.75"
                      y="1"
                      width="20.5"
                      height="10"
                      rx="2.6"
                      stroke="currentColor"
                      strokeOpacity="0.45"
                      strokeWidth="1.2"
                    />
                    <rect x="2.5" y="2.75" width="17" height="6.5" rx="1.4" fill="currentColor" />
                    <path
                      d="M22.5 4.2v3.6a1.4 1.4 0 0 0 0-3.6Z"
                      fill="currentColor"
                      fillOpacity="0.45"
                    />
                  </svg>
                </div>
              </div>

              {/* Bottom Home Indicator Overlay */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex h-7 items-end justify-center pb-2"
              >
                <div className="bg-foreground/25 h-[4px] w-[126px] rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Standalone Link */}
      <div className="text-muted-foreground flex items-center font-mono text-[11px]">
        <a
          href={externalUrl}
          target="_blank"
          rel="noreferrer"
          className="hover:text-foreground inline-flex items-center gap-1 transition-colors"
        >
          <span>새 탭에서 열기</span>
          <ExternalLink className="size-3" />
        </a>
      </div>
    </div>
  );
}
