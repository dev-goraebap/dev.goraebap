import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import mdx from "@mdx-js/rollup";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import { defineConfig, type PluginOption } from "vite";
import { renderBrandMarkSvg } from "./src/shared/ui/brand-mark-geometry";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BRAND_DRAW_CSS_PATH = path.resolve(__dirname, "src/shared/ui/brand-draw.css");

// 정적 부트 스플래시(index.html)에 React BrandMark와 동일한 SVG·그리기 CSS 원본을 주입해 중복을 없앤다.
const brandSplashPlugin: PluginOption = {
  name: "brand-splash-inline",
  transformIndexHtml(html) {
    const drawCss = fs.readFileSync(BRAND_DRAW_CSS_PATH, "utf8");
    return html
      .replace("/* <!--brand-draw-css--> */", drawCss)
      .replace("<!--brand-mark-->", renderBrandMarkSvg("splash-logo brand-draw-loop"));
  },
};

const mdxPlugin = mdx({
  mdExtensions: [".md"],
  // content 밖의 md와 ?raw로 읽는 파일은 글자 그대로 둔다.
  include: /[\\/]content[\\/].*\.mdx?$/,
  remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter, remarkGfm],
});

const rawMdxTransform =
  typeof mdxPlugin.transform === "function" ? mdxPlugin.transform : undefined;

const contentMdxPlugin = {
  ...mdxPlugin,
  enforce: "pre",
  transform(code: string, id: string) {
    if (id.includes("?raw") || !rawMdxTransform) return null;
    return rawMdxTransform.call(this as never, code, id);
  },
} as unknown as PluginOption;

export default defineConfig({
  plugins: [
    brandSplashPlugin,
    // 지침 글의 원본(content/). SKILL.md도 같은 방식으로 읽어 사이트에 보인다.
    contentMdxPlugin,
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
      routesDirectory: "./src/pages",
      generatedRouteTree: "./src/app/router/routeTree.gen.ts",
      indexToken: "page",
      routeFileIgnorePattern: "^(api|model|lib|config|index\\.ts)$",
    }),
    react({ include: /\.(mdx?|[jt]sx?)$/ }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5175,
    proxy: {
      "/demos/react": {
        target: "http://localhost:5176",
        changeOrigin: true,
        ws: true,
      },
      "/demos/angular": {
        target: "http://localhost:5177",
        changeOrigin: true,
        ws: true,
      },
    },
    fs: {
      allow: [path.resolve(__dirname, "../..")],
    },
  },
});
