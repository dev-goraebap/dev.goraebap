// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import mermaid from 'astro-mermaid';

// goraebap.xyz: Webcraft 매뉴얼. 원문은 src/content/docs의 MDX이고, 빌드하면 페이지마다 본문이 든 정적 HTML이 나온다.
// public/r는 shadcn 레지스트리(@webcraft) JSON이며 그대로 /r/ 아래에 나간다.
// 메뉴는 독자가 하려는 일로 나눈다: 시작하기(따라 하기) · 사용 안내(일 해내기) · 개념(이해하기) · 레퍼런스(찾아보기).
export default defineConfig({
  site: 'https://goraebap.xyz',
  server: { port: 4451, host: true },
  integrations: [
    // 도표(```mermaid)는 Starlight보다 먼저 둬야 한다. 테마는 사이트의 라이트·다크를 따른다.
    mermaid({ theme: 'neutral', autoTheme: true, enableLog: false }),
    starlight({
      title: 'Webcraft',
      locales: { root: { label: '한국어', lang: 'ko' } },
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/dev-goraebap/dev.goraebap' }],
      editLink: { baseUrl: 'https://github.com/dev-goraebap/dev.goraebap/edit/main/site/' },
      sidebar: [
        { label: '시작하기', items: [{ label: '소개', link: '/' }, 'start/install', 'start/new-project'] },
        { label: '사용 안내', items: ['guides/working', 'guides/diagnose', 'guides/ui-kit', 'guides/help'] },
        { label: '개념', items: [{ autogenerate: { directory: 'concepts' } }] },
        { label: '레퍼런스', items: [{ autogenerate: { directory: 'reference' } }] },
      ],
    }),
  ],
});
