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

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
      // 사이트가 예시 파일을 그대로 읽는 Webapp 플러그인 지침
      "@webapp-skills": path.resolve(__dirname, "../../../plugins/webapp/skills"),
    },
  },
  server: {
    port: 5175,
    fs: {
      allow: [
        path.resolve(__dirname, "../.."),
        path.resolve(__dirname, "../../../plugins/webapp/skills"),
      ],
    },
  },
});
