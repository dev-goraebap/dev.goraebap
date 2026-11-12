import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// shadcn/ui(Base UI) + Tailwind CSS v4. 스타일은 Tailwind 유틸리티와 src/index.css의 CSS 변수(테마)로만 정한다.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  server: { port: 4470 },
  preview: { port: 4470 },
});
