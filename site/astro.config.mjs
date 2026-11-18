// @ts-check
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import mermaid from 'astro-mermaid';
import starlightThemeRapide from 'starlight-theme-rapide';
import starlightSidebarTopics from 'starlight-sidebar-topics';

// goraebap.xyz: dev.goraebap 공식 문서. 원문은 src/content/docs의 MDX이고, 빌드하면 페이지마다 본문이 든 정적 HTML이 나온다.
// 제품마다 칸(topic) 하나를 두고 주소도 그 아래에 둔다: /web/… (모바일 등이 생기면 칸을 더한다).
// public/r는 shadcn 레지스트리(@webcraft) JSON이며 그대로 /r/ 아래에 나간다.

// 문서의 코드는 서브모듈 examples/cowork에서 읽는다. 코드 블록에 본문 대신 파일과 줄을 적는다:
//   ```ts cowork="web/src/shared/lib/prepare.ts" lines="1-12,…,30-41" {3}
// lines의 …는 건너뛴 자리이며 언어에 맞는 주석(// … · # … · -- …)으로 그린다. 제목은 파일 경로가 된다.
// 파일이 없거나 줄이 파일 밖이면 빌드가 실패한다. 서브모듈 커밋을 올리면 빌드로 어긋난 곳을 찾는다.
const COWORK = fileURLToPath(new URL('../examples/cowork/', import.meta.url));
const CUT = { sql: '-- …', dockerfile: '# …', sh: '# …', bash: '# …', yaml: '# …', toml: '# …' };
function coworkCode() {
  const walk = (node, file) => {
    if (node.type === 'code' && node.meta?.includes('cowork=')) {
      const path = /cowork="([^"]+)"/.exec(node.meta)?.[1];
      const spec = /lines="([^"]+)"/.exec(node.meta)?.[1];
      if (!path || !spec) throw new Error(`${file.path}: cowork 코드 블록에 cowork·lines가 모두 있어야 합니다`);
      const source = readFileSync(COWORK + path, 'utf8').replace(/\r\n/g, '\n').split('\n');
      const lines = spec.split(',').flatMap(range => {
        if (range === '…') return [null];
        const [from, to] = range.split('-').map(Number);
        if (!(from >= 1 && to >= from && to <= source.length)) throw new Error(`${file.path}: ${path}에 ${range}줄이 없습니다`);
        return source.slice(from - 1, to);
      });
      const out = lines;
      node.value = out.map((line, i) => {
        if (line !== null) return line;
        // 건너뛴 자리는 앞뒤 줄 중 더 깊은 들여쓰기에 맞춘다(블록 안에서 잘랐으면 블록 안쪽에 그린다).
        const depth = each => (each ? each.length - each.trimStart().length : 0);
        const before = out.slice(0, i).reverse().find(each => each?.trim());
        const after = out.slice(i + 1).find(each => each?.trim());
        return ' '.repeat(Math.max(depth(before), depth(after))) + (CUT[node.lang] ?? '// …');
      }).join('\n');
      node.meta = node.meta.replace(/cowork="[^"]+"/, `title="${path}"`).replace(/\s*lines="[^"]+"/, '');
    }
    node.children?.forEach(child => walk(child, file));
  };
  return (tree, file) => walk(tree, file);
}

export default defineConfig({
  site: 'https://goraebap.xyz',
  markdown: { remarkPlugins: [coworkCode] },
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
