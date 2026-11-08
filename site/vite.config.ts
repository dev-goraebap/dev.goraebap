import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import mdx from '@mdx-js/rollup';
import rehypeShiki from '@shikijs/rehype';
import react from '@vitejs/plugin-react';
import rehypeSlug from 'rehype-slug';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkMdxFrontmatter from 'remark-mdx-frontmatter';
import { defineConfig } from 'vite';
import { bootCover } from './src/shared/ui/patterns/boot/boot-cover';
import { guideContent, rehypeSkillLinks, rehypeDiagrams } from './content-plugin';

const local = (path: string) => fileURLToPath(new URL(path, import.meta.url));

// 가이드: 키트로 만드는 업무 앱과 같은 스택(Vite + React + TanStack Router)의 SPA. 문서는 MDX로 빌드하고,
// 견본은 sample.html을 iframe으로 띄운다(키트는 창 폭으로 휴대폰을 판정하므로 실제 기기 폭으로 그리기 위해서다).
export default defineConfig({
  root: local('.'),
  publicDir: local('public'),
  plugins: [
    guideContent(),
    {
      enforce: 'pre',
      ...mdx({
        // 지침(.md)은 일반 Markdown, 화면 해설(.mdx)은 견본 부품을 쓰는 MDX로 읽는다.
        mdExtensions: ['.md'],
        mdxExtensions: ['.mdx'],
        providerImportSource: '@mdx-js/react',
        remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter, remarkGfm],
        rehypePlugins: [rehypeSlug, rehypeSkillLinks, rehypeDiagrams, [rehypeShiki, { themes: { light: 'github-light', dark: 'github-dark' }, defaultColor: false }]],
      }),
    },
    react({ include: /\.(jsx|tsx|md|mdx)$/ }),
    bootCover({ mark: readFileSync(local('src/shared/loading/rocket-still.svg'), 'utf8'), modeKey: 'guide-theme',
      include: path => path === '/index.html' }),
  ],
  resolve: {
    alias: { '@samples': local('samples'), '@': local('src') },
    dedupe: ['react', 'react-dom', '@astryxdesign/core', '@astryxdesign/theme-stone'],
  },
  server: { port: 4451, fs: { allow: [local('..')] } },
  preview: { port: 4451 },
  build: {
    outDir: local('dist'),
    emptyOutDir: true,
    rollupOptions: { input: { main: local('index.html'), sample: local('sample.html') } },
  },
});
