// 사이트 content(web/apps/blog/content)에서 스킬 goraebap-webapp의 references/를 만든다.
// SKILL.md가 있는 content 폴더가 메뉴 하나이고, 그 SKILL.md에서 링크로 닿는 문서만 스킬에 넣는다(사람 전용 글은 빠진다).
// 스킬 안 경로는 사이트 주소를 따르되 앞의 reference/를 뗀다: content/reference/frontend/routing/navigation → references/frontend/routing/navigation,
// content/design-system/theme → references/design-system/theme. 문서는 그 폴더의 index.md(공통 글)와 <스택>.md(스택 글)가 된다. <Slot> 자리는 스택 글의 절을 가리키는 한 줄이 되고,
// 스택 파일의 <Fill>은 그 스택 글의 「## <이름>」 절이 된다. <Story>·<Diagram>은 사람 전용이라 지운다.
// 영역(스킬 안 경로의 첫 마디)마다 references/<영역>/README.md에 메뉴 SKILL.md의 본문을 모은다. 스킬의 SKILL.md(영역 안내)는 손으로 관리한다.
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
// 스택 갈래마다 고를 수 있는 스택. 사이트의 SPACE_STACKS·stackSpace와 같다.
export const SPACE_STACKS = { frontend: ['react', 'angular'], backend: ['spring'] };
const stackSpace = rel => {
  const [first, second] = rel.split('/');
  if (first === 'reference') return second === 'backend' ? 'backend' : 'frontend';
  return first === 'backend' ? 'backend' : 'frontend';
};
const SPACE_TITLES = { repo: '레포 구조', frontend: '프론트엔드', backend: '백엔드', 'design-system': '디자인 시스템' };
const ALL_STACKS = Object.values(SPACE_STACKS).flat();
// 사람 전용 블록(1인칭 글, 그림, 움직이는 견본). 스킬에서는 통째로 지운다.
const HUMAN_ONLY = ['Story', 'Diagram', 'Demo'];
// 감싸기만 하는 블록. 스킬에서는 안의 글만 남긴다.
const UNWRAP = ['Callout', 'Term'];
const KNOWN = new Set(['Slot', 'Fill', ...HUMAN_ONLY, ...UNWRAP]);

const processor = () => unified().use(remarkParse).use(remarkMdx).use(remarkFrontmatter).use(remarkGfm, { tablePipeAlign: false })
  .use(remarkStringify, { bullet: '-', fences: true, rule: '-', listItemIndent: 'one' });
const isJsx = node => node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement';
const attr = (node, name) => node.attributes?.find(each => each.name === name)?.value;
const stringify = tree => processor().stringify(tree).trim() + '\n';

async function parse(file) {
  const tree = processor().parse(await fs.readFile(file, 'utf8'));
  const yaml = tree.children.find(node => node.type === 'yaml');
  return { tree, meta: yaml ? parseYaml(yaml.value) ?? {} : {} };
}

// 트리를 돌며 노드를 바꾼다. fn이 배열을 돌려주면 그 자리에 펼친다.
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
  try { await fs.access(file); return true; } catch { return false; }
}

// SKILL.md가 있는 content 폴더. rel은 content 기준 경로, out은 스킬 안 경로(앞의 reference/를 뗌),
// space는 README를 모을 영역(out의 첫 마디), menu는 README 안 절 이름(out의 마지막 마디)이다.
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

/** content로 옮긴 지침(메뉴 SKILL.md)의 이름. skills/의 지침이 이 이름의 없는 파일을 가리키면 사이트가 옮긴 페이지로 잇는다. */
export async function contentSkillNames() {
  const names = new Set();
  for (const { dir } of await findMenus()) names.add((await parse(path.join(dir, 'SKILL.md'))).meta.name);
  return names;
}

// 공통 글 파일 → 문서 이름. 폴더 문서는 폴더 이름, 한 파일 문서는 파일 이름이다.
const docSlug = file => path.basename(file) === 'index.mdx' ? path.basename(path.dirname(file)) : path.basename(file, '.mdx');
// 메뉴 폴더 기준 문서 경로. 하위 폴더에 묶은 문서(예: components/button)는 그 경로를 그대로 쓴다.
const docPath = (dir, file) => path.relative(dir, path.basename(file) === 'index.mdx' ? path.dirname(file) : file.slice(0, -'.mdx'.length)).split(path.sep).join('/');

/** 스킬 폴더 기준 { 'references/... 경로': 내용 }과, 이 빌드가 관리하는 영역 목록을 만든다. */
export async function buildContentSkill() {
  const out = new Map();
  const menus = await findMenus();
  // content 파일 → 스킬 안 경로. 링크를 다시 쓸 때 쓴다.
  const target = new Map();
  const menuAnchor = new Map();
  const plans = [];

  for (const { rel, out: outRoot, space, menu, dir } of menus) {
    const skillFile = path.join(dir, 'SKILL.md');
    const { meta } = await parse(skillFile);
    if (!meta.name || !meta.description) throw new Error(`SKILL.md에 name·description이 없습니다: ${skillFile}`);
    const stacks = SPACE_STACKS[stackSpace(rel)];
    // SKILL.md에서 링크로 닿는 같은 메뉴 안의 문서
    const docs = [];
    const queue = [skillFile];
    const seen = new Set(queue);
    while (queue.length) {
      const file = queue.shift();
      const { tree } = await parse(file);
      rewrite(tree, node => {
        if (node.type !== 'link' || /^(https?:|mailto:|#)/.test(node.url)) return;
        const linked = path.resolve(path.dirname(file), decodeURI(node.url.split('#')[0]));
        if (!linked.startsWith(dir + path.sep) || seen.has(linked) || !linked.endsWith('.mdx')) return;
        if (ALL_STACKS.includes(path.basename(linked, '.mdx'))) return;
        seen.add(linked);
        queue.push(linked);
        docs.push(linked);
      });
    }
    // skills/에 같은 이름의 지침 폴더가 함께 있을 수 있다. 같은 이름의 문서가 두 곳에 함께 있으면 원본이 흐려지므로 멈춘다.
    for (const doc of docs)
      for (const kind of ['references', 'examples']) {
        const old = path.join(SKILLS, meta.name, kind, `${docSlug(doc)}.md`);
        if (await exists(old)) throw new Error(`같은 문서가 content와 skills/에 함께 있습니다: ${path.relative(repo, doc)} ↔ ${path.relative(repo, old)}`);
      }
    for (const doc of docs) {
      const base = `references/${outRoot}/${docPath(dir, doc)}`;
      target.set(doc, `${base}/index.md`);
      const stackFiles = [];
      if (path.basename(doc) === 'index.mdx') {
        for (const entry of await fs.readdir(path.dirname(doc))) {
          if (entry === 'index.mdx' || !entry.endsWith('.mdx')) continue;
          const stack = path.basename(entry, '.mdx');
          if (!stacks.includes(stack)) throw new Error(`이 공간의 스택(${stacks.join(', ')})이 아닌 파일입니다: ${path.join(path.dirname(doc), entry)}`);
          const file = path.join(path.dirname(doc), entry);
          stackFiles.push({ stack, file });
          target.set(file, `${base}/${stack}.md`);
        }
        stackFiles.sort((a, b) => stacks.indexOf(a.stack) - stacks.indexOf(b.stack));
      }
      plans.push({ doc, stackFiles });
    }
    // 메뉴 SKILL.md는 영역 README의 「## <메뉴>」 절이 된다. 앵커 없이 가리키면 그 절로 잇는다.
    target.set(skillFile, `references/${space}/README.md`);
    menuAnchor.set(skillFile, menu);
  }

  // 링크를 스킬 안 위치 기준으로 다시 쓴다. content에 없는 지침(plugins/webapp/skills)을 가리키면 링크를 풀고 글자만 남긴다.
  const relink = (from, to) => node => {
    if (node.type !== 'link' || node.data?.final || /^(https?:|mailto:|#)/.test(node.url)) return;
    const [href, anchor] = node.url.split('#');
    const linked = path.resolve(path.dirname(from), decodeURI(href));
    const dest = target.get(linked);
    if (!dest && linked.startsWith(SKILLS + path.sep)) return node.children;
    // Blog 글은 사람만 읽는 해설이라 스킬에 넣지 않는다. 링크를 풀고 글자만 남긴다(ADR 0008).
    if (!dest && linked.startsWith(path.join(CONTENT, 'blog') + path.sep)) return node.children;
    if (!dest) throw new Error(`스킬에 없는 파일을 가리킵니다: ${from} (${node.url})`);
    const hash = anchor ?? menuAnchor.get(linked);
    node.url = path.posix.relative(path.posix.dirname(to), dest) + (hash ? `#${hash}` : '');
  };
  const link = (url, text) => ({ type: 'link', data: { final: true }, url, children: [{ type: 'text', value: text }] });

  for (const { doc, stackFiles } of plans) {
    const to = target.get(doc);
    const { tree, meta } = await parse(doc);
    if (!meta.title) throw new Error(`title 머리말이 없습니다: ${doc}`);

    // 스택 파일의 Fill: 이름 → 그 이름을 채운 스택
    const fills = new Map();
    for (const { stack, file } of stackFiles) {
      const parsed = await parse(file);
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
        body += `## ${name}\n\n` + stringify(section) + '\n';
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
    for (const name of fills.keys())
      if (!slots.has(name)) throw new Error(`공통 글에 없는 자리를 채웁니다(<Slot name="${name}">이 없음): ${doc}`);
    rewrite(tree, relink(doc, to));
    out.set(to, `# ${meta.title}\n\n` + stringify(tree));
  }

  // 영역 README: 메뉴 SKILL.md의 설명과 본문(첫 제목 제외, 제목 한 단계 내림)을 메뉴 순서로 모은다.
  const spaces = [...new Set(menus.map(each => each.space))];
  for (const space of spaces) {
    const to = `references/${space}/README.md`;
    let body = `# ${SPACE_TITLES[space] ?? space}\n\n`;
    for (const { menu, dir } of menus.filter(each => each.space === space)) {
      const file = path.join(dir, 'SKILL.md');
      const { tree, meta } = await parse(file);
      tree.children = tree.children.filter(node => node.type !== 'yaml' && !(node.type === 'heading' && node.depth === 1));
      rewrite(tree, node => { if (node.type === 'heading') node.depth = Math.min(node.depth + 1, 6); });
      rewrite(tree, relink(file, to));
      body += `## ${menu}\n\n${meta.description}\n\n` + stringify(tree) + '\n';
    }
    out.set(to, body.trim() + '\n');
  }
  return { files: out, spaces };
}

/** 빌드 결과를 OUT에 쓴다. 이 빌드가 관리하는 영역 폴더는 먼저 비운다. */
export async function writeContentSkill() {
  const { files, spaces } = await buildContentSkill();
  for (const space of spaces) await fs.rm(path.join(OUT, 'references', space), { recursive: true, force: true });
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
