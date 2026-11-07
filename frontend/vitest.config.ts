import { fileURLToPath } from "node:url";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

// 견본 검사: 실제 Chromium에서 견본을 그리고 조작한다. 기본 창은 데스크톱 1440×960이다.
export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  cacheDir: "../node_modules/.cache/frontend-tests",
  esbuild: { jsx: "automatic" },
  resolve: {
    alias: { "@kit": fileURLToPath(new URL("./reference", import.meta.url)) },
    dedupe: ["react", "react-dom", "@astryxdesign/core", "@astryxdesign/theme-stone"],
  },
  test: {
    name: "frontend",
    include: ["src/**/*.test.tsx"],
    setupFiles: ["src/catalog/test-setup.ts"],
    fileParallelism: false,
    browser: {
      api: { port: 4433 },
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: "chromium" }],
      viewport: { width: 1440, height: 960 },
    },
  },
});
