// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// goraebap.xyz: Webcraft 매뉴얼. 원문은 src/content/docs의 MDX이고, 빌드하면 페이지마다 본문이 든 정적 HTML이 나온다.
// public/r는 shadcn 레지스트리(@webcraft) JSON이며 그대로 /r/ 아래에 나간다.
export default defineConfig({
  site: 'https://goraebap.xyz',
  server: { port: 4451 },
  integrations: [
    starlight({
      title: 'Webcraft',
      locales: { root: { label: '한국어', lang: 'ko' } },
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/dev-goraebap/dev.goraebap' }],
      editLink: { baseUrl: 'https://github.com/dev-goraebap/dev.goraebap/edit/main/site/' },
      sidebar: [
        { label: '소개', link: '/' },
        'getting-started',
        'new-project',
        'working',
        'diagnose',
        'reference',
        'ui-kit',
        'help',
      ],
    }),
  ],
});
