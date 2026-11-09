// 가이드의 문서 목록을 빌드 때 만든다. 지침은 plugins/webcraft/skills의 Markdown을 원본 그대로 읽고(사본을 두지 않는다),
// 화면 해설·견본 문서는 site/content의 MDX를 읽는다. 결과는 virtual:guide-docs로 앱에 넘긴다.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';
import { visit } from 'unist-util-visit';

const here = path.dirname(fileURLToPath(import.meta.url));
export const skillsRoot = path.resolve(here, '../plugins/webcraft/skills');
export const contentRoot = path.resolve(here, 'content');

export type GuideDoc = {
  /** 사이트 주소. 예: /rules/frontend/, /app-shell/peek/ */
  path: string;
  title: string;
  description?: string;
  /** 메뉴 묶음 주소. 예: /rules/frontend/ */
  group: string;
  order: number;
  /** import.meta.glob 키와 맞추는 원본 위치. 예: plugins/webcraft/skills/frontend/SKILL.md, site/content/app-shell/peek.mdx */
  source: string;
  /** 본문이 스스로 h1을 가지면 true(지침 Markdown). */
  hasTitle: boolean;
  /** 아키텍처 정의서(arc42)에서 이 문서가 맡는 절. 첫 값이 메뉴에서 놓일 절이다. 해당 없으면 비운다. */
  arc42?: string[];
  /** 본문이 띄우는 견본 id와 도표(Mermaid) 원문. 문서로 옮기기 전에 미리 준비해 빈 자리로 그렸다가 채우지 않게 한다. */
  samples?: string[];
  diagrams?: string[];
  kind?: 'post';
  date?: string;
  updated?: string;
  tags?: string[];
  cover?: string;
};

/** 지침 묶음: 메뉴 순서와 이름, 아이콘. */
export const skillGroups = [
  { skill: 'goraebap-mode', label: '작업 방식', icon: 'book' },
  { skill: 'frontend', label: '프론트엔드', icon: 'layout-list' },
  { skill: 'design-system', label: '디자인 시스템', icon: 'sun' },
  { skill: 'backend', label: '백엔드', icon: 'settings' },
  { skill: 'api', label: 'API', icon: 'link' },
  { skill: 'database', label: '데이터베이스', icon: 'archive' },
  { skill: 'architecture', label: '아키텍처', icon: 'layout-board' },
  { skill: 'manage-workflow', label: '프로젝트 연결', icon: 'attachment' },
] as const;

/**
 * 아키텍처 메뉴의 절(arc42). 지침 Markdown과 화면 해설은 프론트매터 arc42로 자기 절을 밝히고, 메뉴는 첫 값의 절 아래에
 * 둔다. 8절은 하위 절로 나눈다. 절마다 site/content/architecture/<id>.mdx(점은 하이픈) 개요 페이지가 있다.
 */
export const architectureSections = [
  { id: '1', label: '소개와 목표', icon: 'home' }, { id: '2', label: '아키텍처 제약', icon: 'lock' }, { id: '3', label: '맥락과 범위', icon: 'link' },
  { id: '4', label: '해결 전략', icon: 'layout-board' }, { id: '5', label: '구성 요소 뷰', icon: 'layout-grid' }, { id: '6', label: '실행 뷰', icon: 'clock' },
  { id: '7', label: '배치 뷰', icon: 'archive' }, { id: '8', label: '횡단 관심사', icon: 'layout-list' },
  { id: '8.1', label: 'API와 모듈 계약' }, { id: '8.2', label: '백엔드 코드' }, { id: '8.3', label: '데이터와 마이그레이션' },
  { id: '8.4', label: '프론트 코드와 상태' }, { id: '8.5', label: '화면 기초' }, { id: '8.6', label: '화면 배치와 탐색' },
  { id: '8.7', label: '데이터 상태와 입력' }, { id: '8.8', label: 'UI 부품 사용' }, { id: '8.9', label: '검증' },
  { id: '9', label: '아키텍처 결정', icon: 'book' },
] as const;
export const sectionPath = (id: string) => `/webcraft/architecture/${id.replace('.', '-')}/`;

/** 화면 해설·견본 묶음(site/content의 폴더). */
export const contentGroups = [
  { dir: 'architecture', label: '아키텍처', icon: 'layout-board' },
  { dir: 'common', label: '화면 공통', icon: 'layout-grid' },
  { dir: 'app-shell', label: '앱 셸', icon: 'sidebar' },
  { dir: 'catalog/foundations', label: 'Foundations (디자인 기초)', icon: 'sun' },
  { dir: 'catalog/primitives', label: 'Primitives (기본 부품)', icon: 'edit' },
  { dir: 'catalog/composites', label: 'Composites (조합 부품)', icon: 'copy' },
  { dir: 'catalog/layouts', label: 'Layouts (레이아웃)', icon: 'layout-board' },
  { dir: 'catalog/patterns', label: 'Patterns (사용 패턴)', icon: 'grip' },
  { dir: 'catalog/playground', label: 'Playground (플레이그라운드)', icon: 'library' },
] as const;

const walk = (dir: string): string[] => readdirSync(dir).flatMap(name => {
  const file = path.join(dir, name);
  return statSync(file).isDirectory() ? walk(file) : [file];
});
const posix = (file: string) => file.split(path.sep).join('/');
const repoPath = (file: string) => posix(path.relative(path.resolve(here, '..'), file));

/** 본문에서 미리 준비할 것: <Sample id="…">의 id와 ```mermaid 코드 블록의 원문. */
const assetsOf = (text: string) => {
  const samples = [...new Set([...text.matchAll(/<Sample\s+id="([^"]+)"/g)].map(match => match[1]))];
  const diagrams = [...text.matchAll(/^```mermaid\r?\n([\s\S]*?)\r?\n```/gm)].map(match => match[1].replace(/\r\n/g, '\n'));
  return { ...(samples.length ? { samples } : {}), ...(diagrams.length ? { diagrams } : {}) };
};

/** 지침 Markdown 파일의 사이트 주소. SKILL.md는 지침 첫 장, 나머지는 하위 경로. */
export function skillRoute(file: string) {
  const relative = posix(path.relative(skillsRoot, file)).replace(/\.md$/, '');
  const [skill, ...rest] = relative.split('/');
  return rest.join('/') === 'SKILL' ? `/webcraft/rules/${skill}/` : `/webcraft/rules/${skill}/${rest.join('/')}/`;
}

const frontmatter = (text: string) => {
  const block = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)?.[1] ?? '';
  const field = (name: string) => /^\s*(?:"|')?(.*?)(?:"|')?\s*$/.exec(new RegExp(`^${name}:\\s*(.+)$`, 'm').exec(block)?.[1] ?? '')?.[1];
  const arc42 = field('arc42')?.split(',').map(value => value.trim()).filter(value => value && value !== 'none');
  return { title: field('title'), description: field('description'), order: Number(/order:\s*(\d+)/.exec(block)?.[1] ?? 99), arc42: arc42?.length ? arc42 : undefined };
};

function skillDocs(): GuideDoc[] {
  return skillGroups.flatMap(({ skill }) => {
    const dir = path.join(skillsRoot, skill);
    const entry = readFileSync(path.join(dir, 'SKILL.md'), 'utf8');
    // 하위 문서는 SKILL.md가 소개하는 순서, 소개하지 않은 문서는 뒤에 이름순으로 둔다.
    const linked = [...entry.matchAll(/\]\(((?:references|playbooks)\/[^)#]+\.md)/g)].map(match => match[1]);
    return walk(dir).filter(file => file.endsWith('.md')).map(file => {
      const text = readFileSync(file, 'utf8');
      const relative = posix(path.relative(dir, file));
      const isEntry = relative === 'SKILL.md';
      const index = linked.indexOf(relative);
      const meta = frontmatter(text);
      return {
        path: skillRoute(file), title: /^# (.+)$/m.exec(text)?.[1].trim() ?? relative,
        description: isEntry ? meta.description : undefined, arc42: meta.arc42, ...assetsOf(text),
        group: meta.arc42 ? sectionPath(meta.arc42[0]) : `/webcraft/rules/${skill}/`,
        order: isEntry ? 0 : index >= 0 ? index + 1 : 500, source: repoPath(file), hasTitle: true,
      };
    }).sort((a, b) => a.order - b.order || a.path.localeCompare(b.path));
  });
}

function contentDocs(): GuideDoc[] {
  return walk(contentRoot).filter(file => /\.mdx?$/.test(file) && !posix(path.relative(contentRoot, file)).startsWith('blog/')).map(file => {
    const relative = posix(path.relative(contentRoot, file)).replace(/\.mdx?$/, '').replace(/(^|\/)index$/, '');
    const text = readFileSync(file, 'utf8');
    const meta = frontmatter(text);
    const group = contentGroups.find(item => relative === item.dir || relative.startsWith(`${item.dir}/`));
    return { path: relative ? `/webcraft/${relative}/` : '/webcraft/', title: meta.title ?? relative, description: meta.description, arc42: meta.arc42, ...assetsOf(text),
      group: meta.arc42 ? sectionPath(meta.arc42[0]) : group ? `/webcraft/${group.dir}/` : '/webcraft/', order: meta.order, source: repoPath(file), hasTitle: false };
  }).sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}

/** 지침 Markdown 안의 상대 링크(../frontend/SKILL.md, references/peek.md#…)를 사이트 주소로 바꾼다. */
export function rehypeSkillLinks() {
  return (tree: unknown, file: { path?: string }) => {
    const from = file.path ? path.resolve(file.path) : '';

    visit(tree as never, 'element', (node: { tagName: string; properties: { href?: unknown; src?: unknown } }) => {
      const href = node.tagName === 'a' ? String(node.properties.href ?? '') : '';
      if (from.startsWith(path.join(contentRoot, 'blog'))) {
        const slug = path.relative(path.join(contentRoot, 'blog/posts'), from).split(path.sep)[0];
        if (node.tagName === 'img' && String(node.properties.src ?? '').startsWith('./assets/')) node.properties.src = `/posts/${slug}/${String(node.properties.src).slice(2)}`;
        if (href.startsWith('/posts/')) node.properties.href = href.replace('/posts/', '/blog/');
        return;
      }
      if (href.startsWith('/') && !href.startsWith('/webcraft/')) { node.properties.href = `/webcraft${href === '/' ? '/' : href}`; return; }
      if (!from.startsWith(skillsRoot) || !href || /^(https?:|#|\/)/.test(href)) return;
      const [target, hash] = href.split('#');
      if (!target.endsWith('.md')) return;
      const resolved = path.resolve(path.dirname(from), target);
      if (!resolved.startsWith(skillsRoot)) return;
      node.properties.href = `${skillRoute(resolved)}${hash ? `#${hash}` : ''}`;
    });
  };
}

/** 문서 목록을 가상 모듈로 내보내고, 파일이 바뀌면 다시 만든다. */
function blogDocs(): GuideDoc[] {
  const postsRoot = path.join(contentRoot, 'blog/posts');
  return readdirSync(postsRoot).flatMap(slug => {
    const file = path.join(postsRoot, slug, 'index.md');
    const text = readFileSync(file, 'utf8');
    const block = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)?.[1] ?? '';
    if (/^published:\s*false/m.test(block)) return [];
    const field = (name: string) => new RegExp(`^${name}:\\s*(.+)$`, 'm').exec(block)?.[1]?.trim().replace(/^["']|["']$/g, '');
    return [{ path: `/blog/${slug}/`, title: field('title') ?? slug, description: field('description'),
      group: '/blog/', order: 0, source: repoPath(file), hasTitle: false, kind: 'post' as const,
      date: field('date'), updated: field('updated'), tags: field('tags')?.replace(/^\[|\]$/g, '').split(',').map(tag => tag.trim()),
      cover: field('cover') ? (existsSync(path.join(here, 'public/posts', slug, 'cover-640.webp')) ? `/posts/${slug}/cover-640.webp` : `/posts/${slug}/${field('cover')!.replace(/^\.\//, '')}`) : undefined }];
  }).sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
}

/** Mermaid 코드는 하이라이터 대신 사이트의 지연 로딩 렌더러가 읽는다. */
export function rehypeDiagrams() {
  return (tree: unknown) => visit(tree as never, 'element', (node: { tagName: string; properties: Record<string, unknown>; children: Array<{ properties?: { className?: string[] }; children?: { value?: string }[] }> }) => {
    if (node.tagName !== 'pre' || !node.children[0]?.properties?.className?.includes('language-mermaid')) return;
    const source = node.children[0].children?.map(child => child.value ?? '').join('') ?? '';
    node.tagName = 'div'; node.properties = { 'data-diagram': source }; node.children = [];
  });
}

export function siteDocuments(): GuideDoc[] {
  return [...contentDocs(), ...skillDocs(), ...blogDocs()];
}

export function guideContent(): Plugin {
  const id = 'virtual:guide-docs';
  return {
    name: 'guide-content',
    resolveId: source => (source === id ? `\0${id}` : undefined),
    load(source) {
      if (source !== `\0${id}`) return undefined;
      const docs = siteDocuments();
      return `export const docs = ${JSON.stringify(docs)};\nexport const skillGroups = ${JSON.stringify(skillGroups)};\nexport const contentGroups = ${JSON.stringify(contentGroups)};
export const architectureSections = ${JSON.stringify(architectureSections)};`;
    },
    generateBundle() {
      const root = path.join(contentRoot, 'blog/posts');
      for (const slug of readdirSync(root)) {
        const assets = path.join(root, slug, 'assets');
        if (!existsSync(assets)) continue;
        for (const file of walk(assets)) this.emitFile({ type: 'asset', fileName: `posts/${slug}/assets/${posix(path.relative(assets, file))}`, source: readFileSync(file) });
      }
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const match = /^\/posts\/([^/]+)\/assets\/(.+)$/.exec((req.url ?? '').split('?')[0]);
        if (!match) return next();
        try {
          const assets = path.resolve(contentRoot, 'blog/posts', decodeURIComponent(match[1]), 'assets');
          const file = path.resolve(assets, decodeURIComponent(match[2]));
          const posts = path.resolve(contentRoot, 'blog/posts');
          if (!assets.startsWith(`${posts}${path.sep}`) || !file.startsWith(`${assets}${path.sep}`) || !existsSync(file) || !statSync(file).isFile()) return next();
          const mime: Record<string, string> = { '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' };
          res.setHeader('Content-Type', mime[path.extname(file)] ?? 'application/octet-stream');
          res.end(readFileSync(file));
        } catch { next(); }
      });
      const reload = (file: string) => {
        if (!file.startsWith(skillsRoot) && !file.startsWith(contentRoot)) return;
        const module = server.moduleGraph.getModuleById(`\0${id}`);
        if (module) server.moduleGraph.invalidateModule(module);
      };
      server.watcher.on('add', reload);
      server.watcher.on('unlink', reload);
      server.watcher.on('change', reload);
    },
  };
}
