import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
      routesDirectory: "./src/pages",
      generatedRouteTree: "./src/app/router/routeTree.gen.ts",
      indexToken: "page",
      routeFileIgnorePattern: "^(api|model|lib|config|index\\.ts)$",
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // 사이트가 예시 파일을 그대로 읽는 Webapp 플러그인 지침
      "@webapp-skills": path.resolve(__dirname, "../../../plugins/webapp/skills"),
    },
  },
  server: {
    port: 5175,
    fs: { allow: [path.resolve(__dirname, "../.."), path.resolve(__dirname, "../../../plugins/webapp/skills")] },
  },
});
