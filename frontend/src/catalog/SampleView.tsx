import { createElement, useLayoutEffect, type ReactNode } from "react";
import { ReferenceTheme } from "@kit/foundations/ReferenceTheme";
import type { Layout, Meta, Sample } from "./types";

/** 견본 하나를 그린다. 인자는 묶음 기본값 위에 견본 값을 덮는다. */
export function renderSample(meta: Meta, sample: Sample): ReactNode {
  const args = { ...meta.args, ...sample.args } as never;
  if (sample.render) return sample.render(args);
  if (meta.render) return meta.render(args);
  return meta.component ? createElement(meta.component, args) : null;
}

/** inline: 문서 안에 끼워 넣을 때. 화면 높이를 채우지 않고 내용을 가운데 둔다. */
const frames: Record<Layout | "inline", React.CSSProperties> = {
  centered: { display: "flex", alignItems: "center", justifyContent: "center", minBlockSize: "100dvh", padding: "1rem", boxSizing: "border-box" },
  padded: { padding: "1rem" },
  fullscreen: { blockSize: "100dvh" },
  inline: { display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "1.5rem 1rem" },
};

/**
 * Astryx Theme은 자기 요소에 토큰만 두고 바탕을 칠하지 않는다. 가운데·여백 배치의 견본도 앱과 같은 면 위에 보이도록
 * 테마의 페이지 면 색과 color-scheme을 문서에 옮긴다.
 */
export function SampleView({ meta, sample, mode, layout }: { meta: Meta; sample: Sample; mode: "light" | "dark"; layout: Layout | "inline" }) {
  useLayoutEffect(() => {
    const themed = document.querySelector("[data-astryx-theme]");
    if (!themed) return;
    const surface = getComputedStyle(themed).getPropertyValue("--color-background-surface").trim();
    document.documentElement.style.colorScheme = mode;
    document.documentElement.style.background = surface;
    document.body.style.background = surface;
  }, [mode]);
  return <ReferenceTheme mode={mode}><div data-sample-frame style={frames[layout]}>{renderSample(meta, sample)}</div></ReferenceTheme>;
}
