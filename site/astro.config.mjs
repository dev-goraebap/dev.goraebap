import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';

const frontend = (path) => fileURLToPath(new URL(`../frontend/${path}`, import.meta.url));

// 가이드는 키트의 앱 셸(AppFrame·Page)로 그린다. 문서는 src/content/docs의 Markdown·MDX이고 메뉴는 src/guide/nav.ts가 정한다.
// 견본은 frontend/src의 *.samples.tsx를 iframe(/samples/…)으로 띄운다. 키트는 창 폭으로 휴대폰을 판정하므로 실제 폭으로 그리기 위해서다.
export default defineConfig({
  // 개발 도구 막대가 견본 iframe마다 떠서 견본을 가린다.
  devToolbar: { enabled: false },
  trailingSlash: 'always',
  integrations: [react(), mdx()],
  markdown: {
    shikiConfig: { themes: { light: 'github-light', dark: 'github-dark' }, defaultColor: false },
  },
  vite: {
    resolve: {
      alias: { '@kit': frontend('reference'), '@frontend': frontend('src') },
      dedupe: ['react', 'react-dom', '@astryxdesign/core', '@astryxdesign/theme-stone'],
    },
  },
});
