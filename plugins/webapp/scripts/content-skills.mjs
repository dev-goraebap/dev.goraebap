// 사이트 content(web/apps/blog/content)에서 스킬 goraebap-webapp의 references/를 만든다.
// 두 가지 원본 형식을 모두 지원한다:
// 1) MDX 메뉴(content/design-system/SKILL.md): SKILL.md에서 링크로 닿는 .mdx와 <Slot>/<Fill> 스택 파일
// 2) Diátaxis 영역(content/{frontend,backend}/{playbooks,reference}): 순수 .md 공통(index.md)과 스택 파일(<stack>.md)
// 사람 전용 글(blog/, articles/, glossary/)과 시각 전용 JSX(<Story>/<Diagram>/<Demo>)는 스킬에서 제외한다.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMdx from 'remark-mdx';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import remarkStringify from 'remark-stringify';
import { parse as parseYaml } from 'yaml';

const root = fileURLToPath(new URL('../', import.meta.url));
const repo = path.resolve(root, '../..');
export const CONTENT = path.join(repo, 'web/apps/blog/content');
export const OUT = path.join(repo, '.agents/skills/goraebap-webapp');
const SKILLS = path.join(root, 'skills');

// MDX 메뉴용 스택 갈래(design-system 등)
export const SPACE_STACKS = {
  frontend: ['react', 'angular'],
  backend: ['spring'],
};
// Diátaxis 영역의 스택 정렬 순서
const DIATAXIS_SPACES = ['frontend', 'backend'];
const DIATAXIS_SECTIONS = [
  { id: 'playbooks', title: '플레이북' },
  { id: 'reference', title: '레퍼런스' },
];
const DIATAXIS_STACK_ORDER = ['react-tanstack', 'react', 'angular', 'springboot', 'nestjs'];
const DIATAXIS_LEGACY_SKILLS = ['frontend-engineering', 'backend-engineering'];

const SPACE_TITLES = {
  repo: '레포 구조',
  frontend: '프론트엔드',
  backend: '백엔드',
  'design-system': '디자인 시스템',
};
const MATURITY_LABELS = {
  stable: '안정',
  refining: '다듬는 중',
};

const stackSpace = rel => {
  const [first, second] = rel.split('/');
  if (first === 'reference') return second === 'backend' ? 'backend' : 'frontend';
  return first === 'backend' ? 'backend' : 'frontend';
};
const ALL_MDX_STACKS = Object.values(SPACE_STACKS).flat();
const HUMAN_ONLY = ['Story', 'Diagram', 'Demo'];
const UNWRAP = ['Callout', 'Term'];
const KNOWN = new Set(['Slot', 'Fill', ...HUMAN_ONLY, ...UNWRAP]);

const mdxProcessor = () =>
  unified()
    .use(remarkParse)
    .use(remarkMdx)
    .use(remarkFrontmatter)
    .use(remarkGfm, { tablePipeAlign: false })
    .use(remarkStringify, { bullet: '-', fences: true, rule: '-', listItemIndent: 'one' });

const mdProcessor = () =>
  unified()
    .use(remarkParse)
    .use(remarkFrontmatter)
    .use(remarkGfm, { tablePipeAlign: false })
    .use(remarkStringify, { bullet: '-', fences: true, rule: '-', listItemIndent: 'one' });

const isJsx = node => node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement';
const attr = (node, name) => node.attributes?.find(each => each.name === name)?.value;
const stringifyMdx = tree => mdxProcessor().stringify(tree).trim() + '\n';
const stringifyMd = tree => mdProcessor().stringify(tree).trim() + '\n';

async function parseMdx(file) {
  const tree = mdxProcessor().parse(await fs.readFile(file, 'utf8'));
  const yaml = tree.children.find(node => node.type === 'yaml');
  return { tree, meta: yaml ? parseYaml(yaml.value) ?? {} : {} };
}

async function parseMd(file) {
  const tree = mdProcessor().parse(await fs.readFile(file, 'utf8'));
  const yaml = tree.children.find(node => node.type === 'yaml');
  return { tree, meta: yaml ? parseYaml(yaml.value) ?? {} : {} };
}

function rewrite(node, fn) {
  if (!node.children) return;
  node.children = node.children.flatMap(child => {
    const result = fn(child);
    const list = result === undefined ? [child] : [result].flat();
    for (const each of list) rewrite(each, fn);
    return list;
  });
}

async function exists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

async function findMenus(dir = CONTENT, menus = []) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const next = path.join(dir, entry.name);
    if (await exists(path.join(next, 'SKILL.md'))) {
      const rel = path.relative(CONTENT, next).split(path.sep).join('/');
      const out = rel.replace(/^reference\//, '');
      menus.push({ rel, out, space: out.split('/')[0], menu: out.split('/').at(-1), dir: next });
    }
    await findMenus(next, menus);
  }
  return dir === CONTENT ? menus.sort((a, b) => a.out.localeCompare(b.out)) : menus;
}

/** content로 옮긴 지침 이름 목록. skills/의 호환 링크 검사에서 쓴다. */
export async function contentSkillNames() {
  const names = new Set(DIATAXIS_LEGACY_SKILLS);
  for (const { dir } of await findMenus()) {
    names.add((await parseMdx(path.join(dir, 'SKILL.md'))).meta.name);
  }
  return names;
}

const docSlug = file =>
  path.basename(file) === 'index.mdx' ? path.basename(path.dirname(file)) : path.basename(file, '.mdx');
const docPath = (dir, file) =>
  path
    .relative(dir, path.basename(file) === 'index.mdx' ? path.dirname(file) : file.slice(0, -'.mdx'.length))
    .split(path.sep)
    .join('/');

function stackSort(a, b) {
  const ia = DIATAXIS_STACK_ORDER.indexOf(a);
  const ib = DIATAXIS_STACK_ORDER.indexOf(b);
  if (ia !== -1 || ib !== -1) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  return a.localeCompare(b);
}

function maturityCallout(meta) {
  if (!meta?.maturity || !MATURITY_LABELS[meta.maturity]) return '';
  const label = MATURITY_LABELS[meta.maturity];
  const note = meta.maturityNote ? ` — ${meta.maturityNote}` : '';
  const reviewed = meta.reviewedAt ? ` (검토 ${meta.reviewedAt})` : '';
  return `> 성숙도: ${label} (${meta.maturity})${note}${reviewed}\n\n`;
}

function plainTextOf(node) {
  if (!node) return '';
  if (typeof node.value === 'string') return node.value;
  if (Array.isArray(node.children)) return node.children.map(plainTextOf).join('');
  return '';
}

/** 스킬 폴더 기준 { 'references/... 경로': 내용 }과, 이 빌드가 관리하는 영역 목록을 만든다. */
export async function buildContentSkill() {
  const out = new Map();
  const menus = await findMenus();
  const target = new Map();
  const siteRouteTarget = new Map();
  const menuAnchor = new Map();
  const mdxPlans = [];
  const diataxisPlans = [];

  // 1) MDX 메뉴 수집 (design-system 등)
  for (const { rel, out: outRoot, space, menu, dir } of menus) {
    const skillFile = path.join(dir, 'SKILL.md');
    const { meta } = await parseMdx(skillFile);
    if (!meta.name || !meta.description) throw new Error(`SKILL.md에 name·description이 없습니다: ${skillFile}`);
    const stacks = SPACE_STACKS[stackSpace(rel)];
    const docs = [];
    const queue = [skillFile];
    const seen = new Set(queue);
    while (queue.length) {
      const file = queue.shift();
      const { tree } = await parseMdx(file);
      rewrite(tree, node => {
        if (node.type !== 'link' || /^(https?:|mailto:|#)/.test(node.url)) return;
        const linked = path.resolve(path.dirname(file), decodeURI(node.url.split('#')[0]));
        if (!linked.startsWith(dir + path.sep) || seen.has(linked) || !linked.endsWith('.mdx')) return;
        if (ALL_MDX_STACKS.includes(path.basename(linked, '.mdx'))) return;
        seen.add(linked);
        queue.push(linked);
        docs.push(linked);
      });
    }
    for (const doc of docs) {
      for (const kind of ['references', 'examples']) {
        const old = path.join(SKILLS, meta.name, kind, `${docSlug(doc)}.md`);
        if (await exists(old)) {
          throw new Error(
            `같은 문서가 content와 skills/에 함께 있습니다: ${path.relative(repo, doc)} ↔ ${path.relative(repo, old)}`,
          );
        }
      }
    }
    for (const doc of docs) {
      const subPath = docPath(dir, doc);
      const base = `references/${outRoot}/${subPath}`;
      const indexOut = `${base}/index.md`;
      target.set(doc, indexOut);
      siteRouteTarget.set(`/${outRoot}/${subPath}`, indexOut);
      const stackFiles = [];
      if (path.basename(doc) === 'index.mdx') {
        for (const entry of await fs.readdir(path.dirname(doc))) {
          if (entry === 'index.mdx' || !entry.endsWith('.mdx')) continue;
          const stack = path.basename(entry, '.mdx');
          if (!stacks.includes(stack)) {
            throw new Error(`이 공간의 스택(${stacks.join(', ')})이 아닌 파일입니다: ${path.join(path.dirname(doc), entry)}`);
          }
          const file = path.join(path.dirname(doc), entry);
          stackFiles.push({ stack, file });
          target.set(file, `${base}/${stack}.md`);
        }
        stackFiles.sort((a, b) => stacks.indexOf(a.stack) - stacks.indexOf(b.stack));
      }
      mdxPlans.push({ doc, stackFiles });
    }
    target.set(skillFile, `references/${space}/README.md`);
    menuAnchor.set(skillFile, menu);
  }

  // 2) Diátaxis 영역 수집 (frontend, backend — playbooks + reference)
  const diataxisSpaces = [];
  for (const space of DIATAXIS_SPACES) {
    const spaceDir = path.join(CONTENT, space);
    if (!(await exists(spaceDir))) continue;
    diataxisSpaces.push(space);

    for (const { id: section } of DIATAXIS_SECTIONS) {
      const sectionDir = path.join(spaceDir, section);
      if (!(await exists(sectionDir))) continue;
      for (const entry of await fs.readdir(sectionDir, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const slug = entry.name;
        const docDir = path.join(sectionDir, slug);
        const indexFile = path.join(docDir, 'index.md');
        if (!(await exists(indexFile))) continue;

        const { meta } = await parseMd(indexFile);
        const base = `references/${space}/${section}/${slug}`;
        const indexOut = `${base}/index.md`;
        target.set(indexFile, indexOut);
        siteRouteTarget.set(`/${space}/${section}/${slug}`, indexOut);

        const stackFiles = [];
        for (const item of await fs.readdir(docDir)) {
          if (item === 'index.md' || !item.endsWith('.md')) continue;
          const stack = path.basename(item, '.md');
          const file = path.join(docDir, item);
          stackFiles.push({ stack, file });
          target.set(file, `${base}/${stack}.md`);
        }
        stackFiles.sort((a, b) => stackSort(a.stack, b.stack));
        diataxisPlans.push({ space, section, slug, indexFile, meta, stackFiles });
      }
    }
  }

  const isHumanOnlyContent = absPath =>
    absPath.startsWith(path.join(CONTENT, 'blog') + path.sep) ||
    absPath.startsWith(path.join(CONTENT, 'glossary') + path.sep) ||
    /[/\\]content[/\\](?:frontend|backend)[/\\]articles[/\\]/.test(absPath);

  const relink = (from, to) => node => {
    if (node.type !== 'link' || node.data?.final || /^(https?:|mailto:|#)/.test(node.url)) return;
    const [href, anchor] = node.url.split('#');
    if (href.startsWith('/')) {
      const normalized = href.replace(/\/$/, '');
      const dest = siteRouteTarget.get(normalized);
      if (!dest) return node.children;
      node.url = path.posix.relative(path.posix.dirname(to), dest) + (anchor ? `#${anchor}` : '');
      return;
    }
    const linked = path.resolve(path.dirname(from), decodeURI(href));
    const dest = target.get(linked);
    if (!dest && linked.startsWith(SKILLS + path.sep)) return node.children;
    if (!dest && isHumanOnlyContent(linked)) return node.children;
    if (!dest) throw new Error(`스킬에 없는 파일을 가리킵니다: ${from} (${node.url})`);
    const hash = anchor ?? menuAnchor.get(linked);
    node.url = path.posix.relative(path.posix.dirname(to), dest) + (hash ? `#${hash}` : '');
  };

  const link = (url, text) => ({
    type: 'link',
    data: { final: true },
    url,
    children: [{ type: 'text', value: text }],
  });

  // 3) MDX 문서 빌드
  for (const { doc, stackFiles } of mdxPlans) {
    const to = target.get(doc);
    const { tree, meta } = await parseMdx(doc);
    if (!meta.title) throw new Error(`title 머리말이 없습니다: ${doc}`);

    const fills = new Map();
    for (const { stack, file } of stackFiles) {
      const parsed = await parseMdx(file);
      const stackPath = target.get(file);
      let body = `# ${meta.title} (${stack})\n\n공통 규칙은 [index.md](index.md)에 있습니다.\n\n`;
      for (const node of parsed.tree.children) {
        if (node.type === 'text' || (node.type === 'paragraph' && !node.children.length)) continue;
        if (!isJsx(node) || node.name !== 'Fill') throw new Error(`스택 파일의 맨 위에는 <Fill>만 둡니다: ${file}`);
        const name = attr(node, 'name');
        if (!fills.has(name)) fills.set(name, []);
        fills.get(name).push(stack);
        const section = { type: 'root', children: node.children };
        rewrite(section, relink(file, stackPath));
        body += `## ${name}\n\n` + stringifyMdx(section) + '\n';
      }
      out.set(stackPath, body.trim() + '\n');
    }

    const slots = new Set();
    rewrite(tree, node => {
      if (node.type === 'yaml' || node.type === 'mdxjsEsm') return [];
      if (!isJsx(node)) return;
      if (!KNOWN.has(node.name)) throw new Error(`모르는 블록 <${node.name}>: ${doc}`);
      if (HUMAN_ONLY.includes(node.name)) return [];
      if (UNWRAP.includes(node.name)) return node.children;
      if (node.name === 'Fill') throw new Error(`공통 글에는 <Fill>을 두지 않습니다: ${doc}`);
      const name = attr(node, 'name');
      slots.add(name);
      if (!fills.has(name)) return [];
      const children = [{ type: 'text', value: '스택별 구현: ' }];
      fills.get(name).forEach((stack, index) => {
        if (index) children.push({ type: 'text', value: ' · ' });
        children.push(link(`${stack}.md#${name}`, `${stack}.md`));
      });
      children.push({ type: 'text', value: `의 「${name}」 절` });
      return [{ type: 'paragraph', children }];
    });
    for (const name of fills.keys()) {
      if (!slots.has(name)) throw new Error(`공통 글에 없는 자리를 채웁니다(<Slot name="${name}">이 없음): ${doc}`);
    }
    rewrite(tree, relink(doc, to));
    out.set(to, `# ${meta.title}\n\n` + maturityCallout(meta) + stringifyMdx(tree));
  }

  // 4) Diátaxis 순수 마크다운 문서 빌드
  for (const { indexFile, stackFiles } of diataxisPlans) {
    const to = target.get(indexFile);
    const { tree, meta } = await parseMd(indexFile);
    if (!meta.title) throw new Error(`title 머리말이 없습니다: ${indexFile}`);

    // 사이트 전용 "스택 전환(...)" 안내 줄은 실제 스택 파일 링크로 교체한다.
    const stackLinksNode = () => {
      if (!stackFiles.length) return null;
      const children = [{ type: 'text', value: '스택별 구현: ' }];
      stackFiles.forEach(({ stack }, index) => {
        if (index) children.push({ type: 'text', value: ' · ' });
        children.push(link(`${stack}.md`, `${stack}.md`));
      });
      return { type: 'paragraph', children };
    };

    let insertedStackLinks = false;
    rewrite(tree, node => {
      if (node.type === 'yaml') return [];
      if (node.type === 'listItem' && plainTextOf(node).includes('스택 전환(')) {
        const replacement = stackLinksNode();
        insertedStackLinks = true;
        return replacement ? [{ type: 'listItem', children: [replacement] }] : [];
      }
      if (node.type === 'paragraph' && plainTextOf(node).includes('스택 전환(')) {
        const replacement = stackLinksNode();
        insertedStackLinks = true;
        return replacement ? [replacement] : [];
      }
    });
    rewrite(tree, relink(indexFile, to));
    const stackFooter =
      !insertedStackLinks && stackFiles.length
        ? `\n스택별 구현: ${stackFiles.map(({ stack }) => `[${stack}.md](${stack}.md)`).join(' · ')}\n`
        : '';
    out.set(to, `# ${meta.title}\n\n` + maturityCallout(meta) + stringifyMd(tree) + stackFooter);

    for (const { stack, file } of stackFiles) {
      const stackOut = target.get(file);
      const parsed = await parseMd(file);
      rewrite(parsed.tree, node => (node.type === 'yaml' ? [] : undefined));
      rewrite(parsed.tree, relink(file, stackOut));
      const heading = parsed.meta.title ?? `${meta.title} (${stack})`;
      out.set(stackOut, `# ${heading}\n\n` + maturityCallout(parsed.meta) + stringifyMd(parsed.tree));
    }
  }

  // 5) MDX 영역 README 생성 (design-system)
  const mdxSpaces = [...new Set(menus.map(each => each.space))];
  for (const space of mdxSpaces) {
    const to = `references/${space}/README.md`;
    let body = `# ${SPACE_TITLES[space] ?? space}\n\n`;
    for (const { menu, dir } of menus.filter(each => each.space === space)) {
      const file = path.join(dir, 'SKILL.md');
      const { tree, meta } = await parseMdx(file);
      tree.children = tree.children.filter(
        node => node.type !== 'yaml' && !(node.type === 'heading' && node.depth === 1),
      );
      rewrite(tree, node => {
        if (node.type === 'heading') node.depth = Math.min(node.depth + 1, 6);
      });
      rewrite(tree, relink(file, to));
      body += `## ${menu}\n\n${meta.description}\n\n` + stringifyMdx(tree) + '\n';
    }
    out.set(to, body.trim() + '\n');
  }

  // 6) Diátaxis 영역 README 생성 (frontend, backend)
  for (const space of diataxisSpaces) {
    const to = `references/${space}/README.md`;
    const spacePlans = diataxisPlans.filter(plan => plan.space === space);
    const availableStacks = [...new Set(spacePlans.flatMap(plan => plan.stackFiles.map(s => s.stack)))].sort(stackSort);

    let body = `# ${SPACE_TITLES[space] ?? space}\n\n`;
    body += `공통 기준(\`index.md\`)을 먼저 읽고, 프로젝트 스택에 해당하는 구현 파일만 함께 읽습니다.\n\n`;
    if (availableStacks.length) {
      body += `스택별 구현 파일: ${availableStacks.map(stack => `\`${stack}.md\``).join(' · ')}\n\n`;
    }

    for (const { id: section, title: sectionTitle } of DIATAXIS_SECTIONS) {
      const docs = spacePlans
        .filter(plan => plan.section === section)
        .sort((a, b) => (a.meta.order ?? 99) - (b.meta.order ?? 99) || a.slug.localeCompare(b.slug));
      if (!docs.length) continue;
      body += `## ${sectionTitle}\n\n`;
      for (const doc of docs) {
        const maturity = doc.meta.maturity && MATURITY_LABELS[doc.meta.maturity]
          ? ` [${MATURITY_LABELS[doc.meta.maturity]}]`
          : '';
        const summary = doc.meta.summary ? `: ${doc.meta.summary}` : '';
        body += `- [${doc.meta.title ?? doc.slug}](${section}/${doc.slug}/index.md)${maturity}${summary}\n`;
      }
      body += '\n';
    }
    out.set(to, body.trim() + '\n');
  }

  const spaces = [...new Set([...mdxSpaces, ...diataxisSpaces])];
  return { files: out, spaces };
}

/** 빌드 결과를 OUT에 쓴다. 이 빌드가 관리하는 영역 폴더는 먼저 비운다. */
export async function writeContentSkill() {
  const { files, spaces } = await buildContentSkill();
  for (const space of spaces) {
    await fs.rm(path.join(OUT, 'references', space), { recursive: true, force: true });
  }
  for (const [file, content] of files) {
    await fs.mkdir(path.dirname(path.join(OUT, file)), { recursive: true });
    await fs.writeFile(path.join(OUT, file), content);
  }
  return files.size;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const count = await writeContentSkill();
  process.stdout.write(`${path.relative(repo, OUT)}에 ${count}개 파일을 만들었습니다\n`);
}
