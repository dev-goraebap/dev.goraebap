import { StrictMode, useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { IconProvider, type IconSetId } from "@goraebap/ui-react/icons";
import {
  applyDesignPayload,
  notifyReady,
  observeDemoHeight,
  readInitialDesignFromQuery,
  type DemoDesignPayload,
} from "./bridge";
import { REACT_DEMOS } from "./demos";
import "./styles.css";

const initial = readInitialDesignFromQuery();
applyDesignPayload(initial);

function App() {
  const [iconSet, setIconSet] = useState<IconSetId>(initial.iconSet ?? "solar");
  const containerRef = useRef<HTMLDivElement>(null);
  const demoSlug = new URLSearchParams(window.location.search).get("demo");
  const isEmbedded = window.parent !== window;

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; payload?: Partial<DemoDesignPayload> } | null;
      if (!data || data.type !== "gb:design-config" || !data.payload) return;
      applyDesignPayload(data.payload);
      if (data.payload.iconSet) setIconSet(data.payload.iconSet);
    };
    window.addEventListener("message", onMessage);
    notifyReady();
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => observeDemoHeight(containerRef.current), [demoSlug]);

  const active = demoSlug ? REACT_DEMOS.find((item) => item.slug === demoSlug) : null;

  return (
    <IconProvider value={iconSet}>
      <div
        ref={containerRef}
        className={
          isEmbedded
            ? "bg-dots bg-background/70 text-foreground flex min-h-56 w-full items-center justify-center p-6 transition-colors sm:p-8"
            : "bg-background text-foreground min-h-screen px-6 py-10"
        }
      >
        {demoSlug ? (
          active ? (
            active.render()
          ) : (
            <p className="text-muted-foreground text-sm">
              &ldquo;{demoSlug}&rdquo; React 데모가 아직 준비되지 않았습니다.
            </p>
          )
        ) : (
          <main className="mx-auto max-w-4xl space-y-8">
            <header className="border-border space-y-2 border-b pb-5">
              <p className="text-muted-foreground font-mono text-xs uppercase">
                @goraebap/react-tanstack-demo
              </p>
              <h1 className="text-2xl font-bold tracking-tight">React · TanStack 라이브 데모</h1>
              <p className="text-muted-foreground text-sm">
                @goraebap/ui-react 어댑터 컴포넌트를 독립 런타임에서 확인합니다.
              </p>
            </header>
            <div className="grid gap-6">
              {REACT_DEMOS.map((item) => (
                <section
                  key={item.slug}
                  className="border-border bg-card overflow-hidden rounded-2xl border"
                >
                  <div className="border-border flex items-center justify-between border-b px-4 py-2.5">
                    <h2 className="text-sm font-semibold">{item.title}</h2>
                    <a
                      href={`?demo=${item.slug}`}
                      className="text-muted-foreground hover:text-foreground font-mono text-xs underline underline-offset-4"
                    >
                      ?demo={item.slug}
                    </a>
                  </div>
                  <div className="bg-dots bg-background/70 flex min-h-40 items-center justify-center p-6">
                    {item.render()}
                  </div>
                </section>
              ))}
            </div>
          </main>
        )}
      </div>
    </IconProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
