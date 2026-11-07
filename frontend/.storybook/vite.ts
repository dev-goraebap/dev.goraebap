import { defineConfig } from "vite";

export default defineConfig({
  esbuild: { jsx: "automatic" },
  optimizeDeps: {
    include: [
      "react/jsx-dev-runtime",
      "@storybook/addon-docs/blocks",
      "@tanstack/react-query",
      "@astryxdesign/core/Resizable",
      "@astryxdesign/core/BottomSheet",
      "@astryxdesign/core/List",
      "@astryxdesign/core/DropdownMenu",
      "@astryxdesign/core/Badge",
      "@astryxdesign/core/Avatar",
      "@astryxdesign/core/TextInput",
      "@astryxdesign/core/Dialog",
    ],
  },
});
