import { fileURLToPath } from "node:url";
import stylex from "@stylexjs/unplugin";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// 순수 Astryx 비교 앱: 우리 키트·규칙 없이 Core 템플릿과 Stone 테마만 쓴다.
// StyleX는 이 앱의 src만 컴파일한다(Astryx는 미리 빌드된 CSS). 접두사 wc로 astryx.css의 x 클래스와 겹치지 않게 하고 app 레이어에 둔다.
const slashed = (path: string) => path.split("\\").join("/");
const src = slashed(fileURLToPath(new URL("./src/", import.meta.url)));
function stylexForOwnSource() {
  const plugin = stylex.vite({ classNamePrefix: "wc", useCSSLayers: { prefix: "app" },
    unstable_moduleResolution: { type: "commonJS", rootDir: fileURLToPath(new URL("../..", import.meta.url)) } });
  const transform = plugin.transform as (this: unknown, ...args: any[]) => unknown;
  return { ...plugin, transform(this: unknown, code: string, id: string, ...rest: unknown[]) {
    return slashed(id).startsWith(src) ? transform.call(this, code, id, ...rest) : null;
  } };
}

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  plugins: [stylexForOwnSource(), react()],
  resolve: { dedupe: ["react", "react-dom", "@astryxdesign/core", "@astryxdesign/theme-stone"] },
  server: { port: 4460 },
  preview: { port: 4460 },
  build: { outDir: "dist", emptyOutDir: true },
});
