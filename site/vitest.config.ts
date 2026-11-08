import { fileURLToPath } from "node:url";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

// 견본 검사: 실제 Chromium에서 견본을 그리고 조작한다. 기본 창은 데스크톱 1440×960이다.
export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  cacheDir: `../node_modules/.cache/kit-tests${process.env.KIT_TEST_PORT ? `-${process.env.KIT_TEST_PORT}` : ""}`,
  esbuild: { jsx: "automatic" },
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)), "@samples": fileURLToPath(new URL("./samples", import.meta.url)) },
    dedupe: ["react", "react-dom", "@astryxdesign/core", "@astryxdesign/theme-stone"],
  },
  // 테스트 도중에 처음 만난 의존성을 다시 묶으면 React가 두 벌 생겨 "Invalid hook call"로 실패한다. 견본이 쓰는
  // 의존성을 키트·견본의 import에서 모아 처음에 함께 묶는다.
  optimizeDeps: { include: ["@astryxdesign/core/Resizable", "@astryxdesign/core/Chat"], entries: ["src/shared/ui/**/*.{ts,tsx}", "samples/**/*.{ts,tsx}"] },
  test: {
    name: "kit",
    include: ["samples/**/*.test.tsx"],
    setupFiles: ["samples/catalog/test-setup.ts"],
    fileParallelism: false,
    browser: {
      api: { port: Number(process.env.KIT_TEST_PORT ?? 4433) },
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: "chromium" }],
      viewport: { width: 1440, height: 960 },
    },
  },
});
