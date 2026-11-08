// 가이드의 문서 목록을 빌드 때 만든다. 지침은 plugin/skills의 Markdown을 원본 그대로 읽고(사본을 두지 않는다),
// 화면 해설·견본 문서는 kit/guide/content의 MDX를 읽는다. 결과는 virtual:guide-docs로 앱에 넘긴다.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';
import { visit } from 'unist-util-visit';

const here = path.dirname(fileURLToPath(import.meta.url));
export const skillsRoot = path.resolve(here, '../../plugin/skills');
export const contentRoot = path.resolve(here, 'content');

export type GuideDoc = {
  /** 사이트 주소. 예: /rules/frontend/, /app-shell/peek/ */
  path: string;
  title: string;
  description?: string;
  /** 메뉴 묶음 주소. 예: /rules/frontend/ */
  group: string;
  order: number;
  /** import.meta.glob 키와 맞추는 원본 위치. 예: plugin/skills/frontend/SKILL.md, kit/guide/content/app-shell/peek.mdx */
  source: string;
  /** 본문이 스스로 h1을 가지면 true(지침 Markdown). */
  hasTitle: boolean;
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

/** 화면 해설·견본·참고 묶음(kit/guide/content의 폴더). */
export const contentGroups = [
  { dir: 'start', label: '시작하기', icon: 'home' },
  { dir: 'common', label: '공통', icon: 'layout-grid' },
  { dir: 'app-shell', label: '앱 셸', icon: 'sidebar' },
  { dir: 'landing', label: '랜딩 (준비 중)', icon: 'home' },
  { dir: 'catalog/foundations', label: 'Foundations (디자인 기초)', icon: 'sun' },
  { dir: 'catalog/primitives', label: 'Primitives (기본 부품)', icon: 'edit' },
  { dir: 'catalog/composites', label: 'Composites (조합 부품)', icon: 'copy' },
  { dir: 'catalog/layouts', label: 'Layouts (레이아웃)', icon: 'layout-board' },
  { dir: 'catalog/patterns', label: 'Patterns (사용 패턴)', icon: 'grip' },
  { dir: 'catalog/playground', label: 'Playground (플레이그라운드)', icon: 'library' },
  { dir: 'references', label: '레퍼런스', icon: 'link' },
] as const;

const walk = (dir: string): string[] => readdirSync(dir).flatMap(name => {
  const file = path.join(dir, name);
  return statSync(file).isDirectory() ? walk(file) : [file];
});
const posix = (file: string) => file.split(path.sep).join('/');
const repoPath = (file: string) => posix(path.relative(path.resolve(here, '../..'), file));

/** 지침 Markdown 파일의 사이트 주소. SKILL.md는 지침 첫 장, 나머지는 하위 경로. */
export function skillRoute(file: string) {
  const relative = posix(path.relative(skillsRoot, file)).replace(/\.md$/, '');
  const [skill, ...rest] = relative.split('/');
  return rest.join('/') === 'SKILL' ? `/rules/${skill}/` : `/rules/${skill}/${rest.join('/')}/`;
}

const frontmatter = (text: string) => {
  const block = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)?.[1] ?? '';
  const field = (name: string) => /^\s*(?:"|')?(.*?)(?:"|')?\s*$/.exec(new RegExp(`^${name}:\\s*(.+)$`, 'm').exec(block)?.[1] ?? '')?.[1];
  return { title: field('title'), description: field('description'), order: Number(/order:\s*(\d+)/.exec(block)?.[1] ?? 99) };
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
      return {
        path: skillRoute(file), title: /^# (.+)$/m.exec(text)?.[1].trim() ?? relative,
        description: isEntry ? frontmatter(text).description : undefined, group: `/rules/${skill}/`,
        order: isEntry ? 0 : index >= 0 ? index + 1 : 500, source: repoPath(file), hasTitle: true,
      };
    }).sort((a, b) => a.order - b.order || a.path.localeCompare(b.path));
  });
}

function contentDocs(): GuideDoc[] {
  return walk(contentRoot).filter(file => /\.mdx?$/.test(file)).map(file => {
    const relative = posix(path.relative(contentRoot, file)).replace(/\.mdx?$/, '').replace(/(^|\/)index$/, '');
    const meta = frontmatter(readFileSync(file, 'utf8'));
    const group = contentGroups.find(item => relative === item.dir || relative.startsWith(`${item.dir}/`));
    return { path: relative ? `/${relative}/` : '/', title: meta.title ?? relative, description: meta.description,
      group: group ? `/${group.dir}/` : '/', order: meta.order, source: repoPath(file), hasTitle: false };
  }).sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}

/** 지침 Markdown 안의 상대 링크(../frontend/SKILL.md, references/peek.md#…)를 사이트 주소로 바꾼다. */
export function rehypeSkillLinks() {
  return (tree: unknown, file: { path?: string }) => {
    const from = file.path ? path.resolve(file.path) : '';
    if (!from.startsWith(skillsRoot)) return;
    visit(tree as never, 'element', (node: { tagName: string; properties: { href?: unknown } }) => {
      const href = node.tagName === 'a' ? String(node.properties.href ?? '') : '';
      if (!href || /^(https?:|#|\/)/.test(href)) return;
      const [target, hash] = href.split('#');
      if (!target.endsWith('.md')) return;
      const resolved = path.resolve(path.dirname(from), target);
      if (!resolved.startsWith(skillsRoot)) return;
      node.properties.href = `${skillRoute(resolved)}${hash ? `#${hash}` : ''}`;
    });
  };
}

/** 문서 목록을 가상 모듈로 내보내고, 파일이 바뀌면 다시 만든다. */
export function guideContent(): Plugin {
  const id = 'virtual:guide-docs';
  return {
    name: 'guide-content',
    resolveId: source => (source === id ? `\0${id}` : undefined),
    load(source) {
      if (source !== `\0${id}`) return undefined;
      const docs = [...contentDocs(), ...skillDocs()];
      return `export const docs = ${JSON.stringify(docs)};\nexport const skillGroups = ${JSON.stringify(skillGroups)};\nexport const contentGroups = ${JSON.stringify(contentGroups)};`;
    },
    configureServer(server) {
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
