/**
 * 견본 틀: 견본 하나를 키트의 바탕 위에 그린다. 가이드의 견본 iframe(SampleFrame)과 검사(run-sample)가 함께 쓴다.
 *
 * html의 data-theme(토큰은 tailwind.css), TooltipProvider, Toaster, 메모리 라우터로 감싼다. 라우터는 어떤 주소든
 * 이 견본을 그린다(처음 주소는 견본 · 묶음의 path, 기본 "/"). 키트의 Link · AppShell · Page가 라우터 없이 깨지지 않게 하려는 것이다.
 * 제 라우터(RouterProvider)를 가진 앱 견본은 그 안에서 다시 감싸도 된다(가까운 라우터가 이긴다).
 */
import { createMemoryHistory, createRootRoute, createRoute, createRouter, RouterProvider } from "@tanstack/react-router";
import { createContext, createElement, useContext, useLayoutEffect, useState, type ReactNode } from "react";
import { cn } from "cn";
import { Toaster } from "@/shared/ui/toast";
import { TooltipProvider } from "@/shared/ui/tooltip";
import type { Layout, Meta, Sample } from "./types";

/** 견본 하나를 그린다. 인자는 묶음 기본값 위에 견본 값을 덮는다. */
export function renderSample(meta: Meta, sample: Sample): ReactNode {
  const args = { ...meta.args, ...sample.args } as never;
  if (sample.render) return sample.render(args);
  if (meta.render) return meta.render(args);
  return meta.component ? createElement(meta.component, args) : null;
}

/** inline: 문서 안에 끼워 넣을 때. 화면 높이를 채우지 않고 내용을 가운데 둔다. */
const frames: Record<Layout | "inline", string> = {
  centered: "box-border flex min-h-dvh items-center justify-center p-4",
  padded: "p-4",
  fullscreen: "h-dvh",
  inline: "flex items-start justify-center px-4 py-6",
};

type Mode = "light" | "dark";

/** 라우터 안에서 그릴 견본. 라우터는 한 번만 만들고, 모드가 바뀌어 다시 그린 견본은 이 맥락으로 건넨다. */
const SampleContent = createContext<ReactNode>(null);

/** 견본의 메모리 라우터. 모든 주소가 견본 하나를 그린다(링크를 눌러도 견본이 사라지지 않고 주소만 바뀐다). */
function SampleRouter({ path, children }: { path: string; children: ReactNode }) {
  const [router] = useState(() => {
    const root = createRootRoute({ component: () => useContext(SampleContent) });
    const any = createRoute({ getParentRoute: () => root, path: "$", component: () => null });
    return createRouter({ routeTree: root.addChildren([any]), history: createMemoryHistory({ initialEntries: [path] }) });
  });
  return <SampleContent value={children}><RouterProvider router={router} /></SampleContent>;
}

export function SampleView({ meta, sample, mode, layout }: { meta: Meta; sample: Sample; mode: Mode; layout: Layout | "inline" }) {
  useLayoutEffect(() => {
    // 바탕은 토큰(body의 bg-background)이 칠한다.
    const root = document.documentElement;
    root.dataset.theme = mode;
    root.style.colorScheme = mode;
  }, [mode]);
  const content = renderSample(meta, sample);
  return <TooltipProvider>
    <Toaster>
      <div data-sample-frame className={cn(frames[layout], "bg-background text-foreground")}>
        <SampleRouter path={sample.path ?? meta.path ?? "/"}>{content}</SampleRouter>
      </div>
    </Toaster>
  </TooltipProvider>;
}
