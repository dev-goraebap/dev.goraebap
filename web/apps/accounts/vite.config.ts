import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    tanstackRouter({
      target: "react",
      routesDirectory: "./src/pages",
      generatedRouteTree: "./src/app/router/routeTree.gen.ts",
      autoCodeSplitting: true,
      indexToken: "page",
      routeFileIgnorePattern: "^(ui|api|model|lib|config|index\\.ts)$",
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5174,
    proxy: {
      "/api": {
        target: process.env.DEV_API_TARGET ?? "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
});
