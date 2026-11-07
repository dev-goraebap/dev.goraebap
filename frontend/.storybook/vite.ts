import { defineConfig } from "vite";

export default defineConfig({
  esbuild: { jsx: "automatic" },
  optimizeDeps: {
    include: [
      "react/jsx-dev-runtime",
      "@tanstack/react-query",
      "@astryxdesign/core/Resizable",
      "@astryxdesign/core/BottomSheet",
      "@astryxdesign/core/List",
      "@astryxdesign/core/DropdownMenu",
    ],
  },
});
