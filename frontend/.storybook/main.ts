import type { StorybookConfig } from "@storybook/react-vite";
const config: StorybookConfig = {
  framework: {
    name: "@storybook/react-vite",
    options: { builder: { viteConfigPath: "frontend/.storybook/vite.ts" } },
  },
  stories: ["../src/**/*.mdx", "../src/**/*.stories.tsx"],
  addons: [
    "@storybook/addon-docs",
    "@storybook/addon-a11y",
    "@storybook/addon-vitest",
  ],
  core: { disableTelemetry: true },
  features: { sidebarOnboardingChecklist: false },
  docs: { defaultName: "사용 기준" },
  async viteFinal(config) {
    config.server = {
      ...config.server,
      watch: {
        ...config.server?.watch,
        ignored: ["**/.tmp/**", "**/dist/**", "**/storybook-static/**"],
      },
    };
    config.resolve = {
      ...config.resolve,
      dedupe: [
        "react",
        "react-dom",
        "@astryxdesign/core",
        "@astryxdesign/theme-stone",
      ],
    };
    return config;
  },
};
export default config;
