// 사이트 content(web/apps/blog/content)에서 플러그인 스킬을 만든다.
// SKILL.md가 있는 폴더가 스킬 하나이고, SKILL.md에서 링크를 따라 닿는 문서만 스킬에 넣는다(사람 전용 글은 빠진다).
// 공통 글(<문서>.mdx, <문서>/index.mdx)은 references/<문서>.md가 되고, <Slot> 자리는 예시를 가리키는 한 줄이 된다.
// 스택 파일(<문서>/<스택>.mdx)의 <Fill>은 examples/<문서>.md의 「## <스택>」 절이 된다. <Story>·<Diagram>은 사람 전용이라 지운다.
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
const SKILLS = path.join(root, 'skills');
// 공간마다 고를 수 있는 스택. 사이트의 SPACE_STACKS와 같다.
export const SPACE_STACKS = { frontend: ['react', 'angular'], backend: ['spring'] };
const ALL_STACKS = Object.values(SPACE_STACKS).flat();
// 사람 전용 블록. 플러그인에서는 통째로 지운다.
const HUMAN_ONLY = ['Story', 'Diagram'];
// 감싸기만 하는 블록. 플러그인에서는 안의 글만 남긴다.
const UNWRAP = ['Callout'];
const KNOWN = new Set(['Slot', 'Fill', ...HUMAN_ONLY, ...UNWRAP]);

const processor = () => unified().use(remarkParse).use(remarkMdx).use(remarkFrontmatter).use(remarkGfm, { tablePipeAlign: false })
  .use(remarkStringify, { bullet: '-', fences: true, rule: '-', listItemIndent: 'one' });
const isJsx = node => node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement';
const attr = (node, name) => node.attributes?.find(each => each.name === name)?.value;

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

async function findSkillDirs(dir, found = []) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const next = path.join(dir, entry.name);
    if (entry.isDirectory()) await findSkillDirs(next, found);
    else if (entry.name === 'SKILL.md') found.push(dir);
  }
  return found;
}

// 공통 글 파일 → 문서 이름. 폴더 문서는 폴더 이름, 한 파일 문서는 파일 이름이다.
const docSlug = file => path.basename(file) === 'index.mdx' ? path.basename(path.dirname(file)) : path.basename(file, '.mdx');

/** content의 스킬을 { 'skills/<스킬>/... 경로': 내용 } 으로 만든다. */
export async function buildContentSkills() {
  const out = new Map();
  const skillDirs = await findSkillDirs(CONTENT);
  // content 파일 → 배포 경로(skills/ 기준). 링크를 다시 쓸 때 쓴다.
  const target = new Map();
  const plans = [];

  for (const dir of skillDirs) {
    const skillFile = path.join(dir, 'SKILL.md');
    const { meta } = await parse(skillFile);
    if (!meta.name) throw new Error(`SKILL.md에 name이 없습니다: ${skillFile}`);
    const space = path.relative(CONTENT, dir).split(path.sep)[0];
    const stacks = SPACE_STACKS[space] ?? [];
    target.set(skillFile, `${meta.name}/SKILL.md`);
    // SKILL.md에서 링크로 닿는 같은 스킬 안의 문서
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
    for (const doc of docs) {
      const slug = docSlug(doc);
      target.set(doc, `${meta.name}/references/${slug}.md`);
      const stackFiles = [];
      if (path.basename(doc) === 'index.mdx') {
        for (const entry of await fs.readdir(path.dirname(doc))) {
          if (entry === 'index.mdx' || !entry.endsWith('.mdx')) continue;
          const stack = path.basename(entry, '.mdx');
          if (!stacks.includes(stack)) throw new Error(`이 공간의 스택(${stacks.join(', ')})이 아닌 파일입니다: ${path.join(path.dirname(doc), entry)}`);
          stackFiles.push({ stack, file: path.join(path.dirname(doc), entry) });
        }
        stackFiles.sort((a, b) => stacks.indexOf(a.stack) - stacks.indexOf(b.stack));
        for (const { file } of stackFiles) target.set(file, `${meta.name}/examples/${slug}.md`);
      }
      plans.push({ skill: meta.name, doc, slug, stackFiles });
    }
    plans.push({ skill: meta.name, doc: skillFile, slug: null, stackFiles: [] });
  }

  // 링크를 배포 위치 기준으로 다시 쓴다. 아직 content로 옮기지 않은 스킬은 plugins/webapp/skills의 같은 경로로 잇는다.
  const relink = (from, to) => node => {
    if (node.type !== 'link' || node.data?.final || /^(https?:|mailto:|#)/.test(node.url)) return;
    const [href, anchor] = node.url.split('#');
    const linked = path.resolve(path.dirname(from), decodeURI(href));
    let dest = target.get(linked);
    if (!dest && linked.startsWith(SKILLS + path.sep)) dest = path.relative(SKILLS, linked).split(path.sep).join('/');
    if (!dest) throw new Error(`배포본에 없는 파일을 가리킵니다: ${from} (${node.url})`);
    node.url = path.posix.relative(path.posix.dirname(to), dest) + (anchor ? `#${anchor}` : '');
  };
  const front = (meta, keys) => `---\n${keys.filter(key => meta[key] !== undefined).map(key => `${key}: ${key === 'arc42' ? JSON.stringify(String(meta[key])) : meta[key]}`).join('\n')}\n---\n\n`;
  const stringify = tree => processor().stringify(tree).trim() + '\n';

  for (const { skill, doc, slug, stackFiles } of plans) {
    const to = target.get(doc);
    const { tree, meta } = await parse(doc);
    if (!slug) {
      rewrite(tree, relink(doc, to));
      tree.children = tree.children.filter(node => node.type !== 'yaml');
      out.set(to, front(meta, ['name', 'description', 'arc42']) + stringify(tree));
      continue;
    }
    if (!meta.title || !meta.arc42) throw new Error(`title·arc42 머리말이 없습니다: ${doc}`);

    // 스택 파일의 Fill: 이름 → 스택별 내용
    const fills = new Map();
    let examples = '';
    for (const { stack, file } of stackFiles) {
      const parsed = await parse(file);
      const examplePath = target.get(file);
      let section = `## ${stack}\n\n`;
      for (const node of parsed.tree.children) {
        if (node.type === 'text' || (node.type === 'paragraph' && !node.children.length)) continue;
        if (!isJsx(node) || node.name !== 'Fill') throw new Error(`스택 파일의 맨 위에는 <Fill>만 둡니다: ${file}`);
        const name = attr(node, 'name');
        if (!fills.has(name)) fills.set(name, new Set());
        fills.get(name).add(stack);
        const body = { type: 'root', children: node.children };
        rewrite(body, relink(file, examplePath));
        section += stringify(body) + '\n';
      }
      examples += section;
    }

    const slots = new Set();
    const examplePath = `${skill}/examples/${slug}.md`;
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
      return [{ type: 'paragraph', children: [
        { type: 'text', value: '스택별 구현: ' },
        { type: 'link', data: { final: true }, url: path.posix.relative(path.posix.dirname(to), examplePath), children: [{ type: 'text', value: `examples/${slug}.md` }] },
        { type: 'text', value: `의 ${[...fills.get(name)].join('·')} 절` },
      ] }];
    });
    for (const name of fills.keys())
      if (!slots.has(name)) throw new Error(`공통 글에 없는 자리를 채웁니다(<Slot name="${name}">이 없음): ${doc}`);
    rewrite(tree, relink(doc, to));
    out.set(to, front(meta, ['arc42']) + `# ${meta.title}\n\n` + stringify(tree));
    if (examples) {
      const rule = path.posix.relative(path.posix.dirname(examplePath), to);
      out.set(examplePath, front(meta, ['arc42']) + `# ${meta.title} 예시\n\n규칙은 [${meta.title}](${rule})에 있습니다. 프로젝트 스택과 같은 절만 읽습니다.\n\n` + examples.trim() + '\n');
    }
  }
  return out;
}

// content로 옮긴 스킬과 같은 이름의 폴더가 skills/에 남아 있으면 둘 중 무엇이 원본인지 흐려진다.
export async function assertNoDuplicate(names) {
  for (const name of names)
    if (await exists(path.join(SKILLS, name))) throw new Error(`content로 옮긴 스킬이 skills/에도 있습니다: ${name}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  for (const [file, content] of await buildContentSkills()) process.stdout.write(`=== ${file}\n${content}\n`);
}
