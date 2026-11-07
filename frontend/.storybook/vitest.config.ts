import { fileURLToPath } from "node:url";
import { defineConfig, mergeConfig } from "vitest/config";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";
import reference from "./vite";
export default mergeConfig(
  reference,
  defineConfig({
    cacheDir: "node_modules/.cache/pattern-tests",
    test: {
      projects: [
        {
          extends: true,
          plugins: [
            storybookTest({
              configDir: fileURLToPath(new URL(".", import.meta.url)),
            }),
          ],
          test: {
            name: "patterns",
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
        },
      ],
    },
  }),
);
