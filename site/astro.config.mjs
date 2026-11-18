// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import mermaid from 'astro-mermaid';
import starlightThemeRapide from 'starlight-theme-rapide';
import starlightSidebarTopics from 'starlight-sidebar-topics';

// goraebap.xyz: dev.goraebap 공식 문서. 원문은 src/content/docs의 MDX이고, 빌드하면 페이지마다 본문이 든 정적 HTML이 나온다.
// 제품마다 칸(topic) 하나를 두고 주소도 그 아래에 둔다: /web/… (모바일 등이 생기면 칸을 더한다).
// public/r는 shadcn 레지스트리(@webcraft) JSON이며 그대로 /r/ 아래에 나간다.
export default defineConfig({
  site: 'https://goraebap.xyz',
  server: { port: 4451, host: true },
  redirects: {
    '/start/install': '/web/start/install/',
    '/start/new-project': '/web/start/new-project/',
    '/guides/working': '/web/working/delegate/',
    '/guides/diagnose': '/web/working/diagnose/',
    '/guides/ui-kit': '/web/frontend/ui-kit/',
    '/guides/help': '/web/working/help/',
    '/concepts/repo-and-fsd': '/web/project/repository/',
    '/reference/rules': '/web/reference/rules/',
  },
  integrations: [
    // 도표(```mermaid)는 Starlight보다 먼저 둬야 한다. 테마는 사이트의 라이트·다크를 따른다.
    mermaid({ theme: 'neutral', autoTheme: true, enableLog: false }),
    starlight({
      title: 'dev.goraebap',
      locales: { root: { label: '한국어', lang: 'ko' } },
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/dev-goraebap/dev.goraebap' }],
      editLink: { baseUrl: 'https://github.com/dev-goraebap/dev.goraebap/edit/main/site/' },
      plugins: [
        starlightThemeRapide(),
        // 메뉴는 독자가 하려는 일 순서로 둔다: 시작 → 구성 이해(프로젝트·프론트·백엔드) → 일하기 → 찾아보기.
        starlightSidebarTopics(
          [
            {
              label: 'Web',
              link: '/web/',
              icon: 'laptop',
              items: [
                { label: '시작하기', items: [{ label: '소개', link: '/web/' }, 'web/start/install', 'web/start/new-project'] },
                { label: '프로젝트 구성', items: [{ autogenerate: { directory: 'web/project' } }] },
                { label: '프론트엔드', items: [{ autogenerate: { directory: 'web/frontend' } }] },
                { label: '백엔드', items: [{ autogenerate: { directory: 'web/backend' } }] },
                { label: '작업 방식', items: [{ autogenerate: { directory: 'web/working' } }] },
                { label: '레퍼런스', items: [{ autogenerate: { directory: 'web/reference' } }] },
              ],
            },
          ],
          { exclude: ['/'] },
        ),
      ],
    }),
  ],
});
