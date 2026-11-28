// 사이트 content(web/apps/blog/content)에서 fullstack 플러그인의 4개 스킬을 빌드한다.
// - goraebap-mode (전역 오케스트레이터 — content/webapp/{playbooks,articles,reference} + 도메인 스킬 카탈로그)
// - frontend-uiux (content/design-system/)
// - frontend-engineering (content/frontend/{playbooks,articles,reference})
// - backend-engineering (content/backend/{playbooks,articles,reference})
// 각 스킬 폴더 직하에 SKILL.md(얇은 라우터), playbooks/, articles/, reference/를 평탄하게 둔다.
// 사람 전용 글(blog/, glossary/, webapp/tutorials/)과 시각 전용 JSX(<Story>/<Diagram>/<Demo>)는 스킬에서 제외한다.
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
export const REPO = path.resolve(root, '../..');
export const CONTENT = path.join(REPO, 'web/apps/blog/content');

export const SKILL_NAMES = ['goraebap-mode', 'frontend-uiux', 'frontend-engineering', 'backend-engineering'];

// MDX 메뉴 폴더명 → 배포 스킬 이름 매핑
const MDX_SKILL_NAME = {
  'design-system': 'frontend-uiux',
};

// MDX 메뉴용 스택 갈래(design-system 등)
export const SPACE_STACKS = {
  frontend: ['react', 'angular'],
  backend: ['spring'],
};

const DIATAXIS_SPACES = [
  { space: 'webapp', skill: 'goraebap-mode', isOrchestrator: true },
  { space: 'frontend', skill: 'frontend-engineering', isOrchestrator: false },
  { space: 'backend', skill: 'backend-engineering', isOrchestrator: false },
];
const DIATAXIS_SECTIONS = [
  { id: 'playbooks', title: '플레이북' },
  { id: 'articles', title: '아티클' },
  { id: 'reference', title: '레퍼런스' },
];
const DIATAXIS_STACK_ORDER = ['react-tanstack', 'react', 'angular', 'springboot', 'nestjs'];

const DIATAXIS_SKILL_META = {
  'goraebap-mode': {
    title: '고래밥 모드 (전역 오케스트레이터)',
    description:
      '프로젝트의 AGENTS.md와 전역 플레이북(모노레포 구성·풀스택 기능 추가·에이전트 문서 구성)을 기준으로 프론트엔드·백엔드·UI/UX 도메인 스킬을 조합해 실행하는 전역 진입점입니다.',
  },
  'frontend-engineering': {
    title: '프론트엔드 엔지니어링',
    description:
      '프론트엔드 엔지니어링 구현 기준과 플레이북입니다. 레이어·폴더 구조, 구성 요소와 실행 흐름, 상태·데이터 흐름, 라우팅, 렌더링, 표준 라이브러리, 코드 스타일과 프로젝트 구성·화면 추가 절차를 다룰 때 사용합니다.',
  },
  'backend-engineering': {
    title: '백엔드 엔지니어링',
    description:
      '백엔드 엔지니어링 구현 기준과 플레이북입니다. 패키지·디렉토리 구조, 구성 요소와 실행 흐름, API 설계, 오류 처리, 데이터 접근, 표준 라이브러리, 코드 스타일과 프로젝트 구성·기능 추가 절차를 다룰 때 사용합니다.',
  },
};

const MATURITY_LABELS = {
  stable: '안정',
  refining: '다듬는 중',
};

const MATURITY_GUIDE = [
  '## 성숙도(`maturity`)에 따른 적용 강도',
  '',
  '문서 상단에 성숙도가 적혀 있으면 단계에 맞춰 기준을 적용합니다. 성숙도가 생략된 문서는 기본 권장 기준으로 다룹니다.',
  '',
  '| `maturity` | 단계 | 적용 강도 |',
  '| --- | --- | --- |',
  '| `stable` | 안정 | 기본 기준 — 프로젝트 규칙에 예외가 없으면 그대로 따름 |',
  '| `refining` | 다듬는 중 | 참고 기준 — 적용을 검토하되 현재 작업 맥락에 맞게 유연하게 판단·확인 |',
].join('\n');

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
      const folder = out.split('/')[0];
      menus.push({ rel, out, skill: MDX_SKILL_NAME[folder] ?? folder, dir: next });
    }
    await findMenus(next, menus);
  }
  return dir === CONTENT ? menus.sort((a, b) => a.out.localeCompare(b.out)) : menus;
}

const docPath = (dir, file) =>
  path
    .relative(dir, path.basename(file) === 'index.mdx' ? path.dirname(file) : file.slice(0, -'.mdx'.length))
    .split(path.sep)
    .join('/');

function mdxSectionFor(meta) {
  if (meta?.group === '플레이북') return 'playbooks';
  if (meta?.group === '아티클') return 'articles';
  return 'reference';
}

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

function yamlScalar(value) {
  return JSON.stringify(String(value).replace(/\s+/g, ' ').trim());
}

/**
 * skills/ 루트 기준 Map<'<skill>/...', content>을 생성한다.
 */
export async function buildContentSkills() {
  const out = new Map();
  const menus = await findMenus();
  const target = new Map();
  const siteRouteTarget = new Map();
  const mdxPlans = [];
  const diataxisPlans = [];
  const domainCatalog = new Map();

  // 1) MDX 메뉴 수집 (design-system → frontend-uiux)
  for (const { rel, out: outRoot, skill, dir } of menus) {
    const skillFile = path.join(dir, 'SKILL.md');
    const { meta } = await parseMdx(skillFile);
    if (!meta.name || !meta.description) throw new Error(`SKILL.md에 name·description이 없습니다: ${skillFile}`);
    domainCatalog.set(skill, meta.description);
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
      const { meta: docMeta } = await parseMdx(doc);
      const subPath = docPath(dir, doc);
      const section = mdxSectionFor(docMeta);
      const base = `${skill}/${section}/${subPath}`;
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
    target.set(skillFile, `${skill}/SKILL.md`);
  }

  // 2) Diátaxis 영역 수집 (agents → goraebap-mode, frontend → frontend-engineering, backend → backend-engineering)
  const diataxisSpaces = [];
  for (const entrySpec of DIATAXIS_SPACES) {
    const { space, skill, isOrchestrator } = entrySpec;
    const spaceDir = path.join(CONTENT, space);
    if (!(await exists(spaceDir))) continue;
    diataxisSpaces.push(entrySpec);
    if (!isOrchestrator && DIATAXIS_SKILL_META[skill]) {
      domainCatalog.set(skill, DIATAXIS_SKILL_META[skill].description);
    }

    for (const { id: section } of DIATAXIS_SECTIONS) {
      const sectionDir = path.join(spaceDir, section);
      if (!(await exists(sectionDir))) continue;

      for (const entry of await fs.readdir(sectionDir, { withFileTypes: true })) {
        if (entry.isDirectory()) {
          const slug = entry.name;
          const docDir = path.join(sectionDir, slug);
          const indexFile = path.join(docDir, 'index.md');
          if (!(await exists(indexFile))) continue;

          const { meta } = await parseMd(indexFile);
          const base = `${skill}/${section}/${slug}`;
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
          diataxisPlans.push({ space, skill, section, slug, indexFile, outPath: indexOut, meta, stackFiles });
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          const slug = path.basename(entry.name, '.md');
          const file = path.join(sectionDir, entry.name);
          const { meta } = await parseMd(file);
          const outPath = `${skill}/${section}/${slug}.md`;
          target.set(file, outPath);
          siteRouteTarget.set(`/${space}/${section}/${slug}`, outPath);
          diataxisPlans.push({ space, skill, section, slug, indexFile: file, outPath, meta, stackFiles: [] });
        }
      }
    }
  }

  const isHumanOnlyContent = absPath =>
    absPath.startsWith(path.join(CONTENT, 'blog') + path.sep) ||
    absPath.startsWith(path.join(CONTENT, 'glossary') + path.sep) ||
    absPath.startsWith(path.join(CONTENT, 'webapp', 'tutorials') + path.sep);

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
    if (!dest && isHumanOnlyContent(linked)) return node.children;
    if (!dest) throw new Error(`스킬에 없는 파일을 가리킵니다: ${from} (${node.url})`);
    node.url = path.posix.relative(path.posix.dirname(to), dest) + (anchor ? `#${anchor}` : '');
  };

  const link = (url, text) => ({
    type: 'link',
    data: { final: true },
    url,
    children: [{ type: 'text', value: text }],
  });

  // 3) MDX 문서 빌드 (frontend-uiux)
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

  // 4) MDX 스킬 SKILL.md 빌드 (frontend-uiux/SKILL.md)
  for (const { skill, dir } of menus) {
    const file = path.join(dir, 'SKILL.md');
    const to = `${skill}/SKILL.md`;
    const { tree, meta } = await parseMdx(file);
    tree.children = tree.children.filter(node => node.type !== 'yaml');
    rewrite(tree, relink(file, to));
    const frontmatter = `---\nname: ${skill}\ndescription: ${yamlScalar(meta.description)}\n---\n\n`;
    out.set(to, `${frontmatter}${stringifyMdx(tree).trim()}\n\n${MATURITY_GUIDE}\n`);
  }

  // 5) Diátaxis 문서 빌드 (goraebap-mode, frontend-engineering, backend-engineering)
  for (const { indexFile, stackFiles } of diataxisPlans) {
    const to = target.get(indexFile);
    const { tree, meta } = await parseMd(indexFile);
    if (!meta.title) throw new Error(`title 머리말이 없습니다: ${indexFile}`);

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

  // 6) Diátaxis 스킬 얇은 라우터 SKILL.md 생성
  for (const { space, skill, isOrchestrator } of diataxisSpaces) {
    const info = DIATAXIS_SKILL_META[skill];
    if (!info) throw new Error(`스킬 메타데이터가 정의되지 않았습니다: ${skill}`);
    const to = `${skill}/SKILL.md`;
    const spacePlans = diataxisPlans.filter(plan => plan.space === space);
    const availableStacks = [...new Set(spacePlans.flatMap(plan => plan.stackFiles.map(s => s.stack)))].sort(stackSort);
    const relOf = doc => path.posix.relative(skill, doc.outPath);
    const sortDocs = section =>
      spacePlans
        .filter(plan => plan.section === section)
        .sort((a, b) => (a.meta.order ?? 99) - (b.meta.order ?? 99) || a.slug.localeCompare(b.slug));
    const maturityTag = doc =>
      doc.meta.maturity && MATURITY_LABELS[doc.meta.maturity] ? ` [${MATURITY_LABELS[doc.meta.maturity]}]` : '';

    let body = `---\nname: ${skill}\ndescription: ${yamlScalar(info.description)}\n---\n\n`;
    body += `# ${info.title}\n\n`;

    if (isOrchestrator) {
      body += `전역 작업을 분류하고 프로젝트 문서와 도메인 스킬을 조합해 실행하는 최상위 라우터입니다.\n\n`;
      body += `## 0단계: 프로젝트 지침 먼저 확인\n\n`;
      body += `1. 작업 시작 전 현재 저장소 루트의 \`AGENTS.md\`를 반드시 읽습니다.\n`;
      body += `2. \`AGENTS.md\`의 라우팅 표에서 현재 작업 경로·유형에 해당하는 \`docs/\` 문서를 먼저 로드합니다.\n`;
      body += `3. 프로젝트 규칙(\`AGENTS.md\` · \`docs/\`)이 이 플러그인 기준과 다르면 프로젝트 규칙을 우선합니다.\n\n`;
    } else {
      body += `사용자 요청을 아래 플레이북으로 먼저 분류하고, 플레이북이 안내하는 레퍼런스와 필요 시 아티클을 조합해 작업을 진행합니다. 프로젝트의 \`AGENTS.md\`에 별도 프로젝트 규칙이 있으면 그 규칙을 우선합니다.\n\n`;
      body += `공통 기준(\`index.md\`)을 먼저 읽고, 프로젝트 스택에 해당하는 구현 파일만 함께 읽습니다.\n\n`;
      if (availableStacks.length) {
        body += `스택별 구현 파일: ${availableStacks.map(stack => `\`${stack}.md\``).join(' · ')}\n\n`;
      }
    }

    const playbooks = sortDocs('playbooks');
    if (playbooks.length) {
      body += isOrchestrator ? `## 1단계: 전역 요청 분류 (플레이북)\n\n` : `## 요청 분류 (플레이북)\n\n`;
      body += `| 요청 유형 | 플레이북 |\n`;
      body += `| --- | --- |\n`;
      for (const doc of playbooks) {
        const trigger = (doc.meta.summary ?? doc.meta.title ?? doc.slug).replace(/\|/g, '\\|');
        body += `| ${trigger} | [${doc.meta.title ?? doc.slug}](${relOf(doc)})${maturityTag(doc)} |\n`;
      }
      body += isOrchestrator
        ? `\n단일 영역 작업이거나 전역 플레이북이 도메인 작업을 위임하면 아래 도메인 스킬 라우터를 이어서 실행합니다.\n\n`
        : `\n해당하는 플레이북이 없는 단일 수정·질문·규격 확인은 아래 레퍼런스에서 필요한 문서만 직접 읽습니다.\n\n`;
    }

    if (isOrchestrator && domainCatalog.size) {
      body += `## 2단계: 도메인 스킬 라우터\n\n`;
      body += `맥락에 맞는 도메인 스킬의 \`SKILL.md\`를 열어 해당 영역의 플레이북과 레퍼런스로 이어서 진행합니다.\n\n`;
      body += `| 도메인 스킬 | 맡는 영역 |\n`;
      body += `| --- | --- |\n`;
      for (const [domainSkill, desc] of domainCatalog) {
        body += `| [${domainSkill}](../${domainSkill}/SKILL.md) | ${desc.replace(/\|/g, '\\|')} |\n`;
      }
      body += '\n';
    }

    const references = sortDocs('reference');
    if (references.length) {
      body += isOrchestrator ? `## 공통 레퍼런스 (직접 참조)\n\n` : `## 레퍼런스 (직접 참조)\n\n`;
      for (const doc of references) {
        const summary = doc.meta.summary ? `: ${doc.meta.summary}` : '';
        body += `- [${doc.meta.title ?? doc.slug}](${relOf(doc)})${maturityTag(doc)}${summary}\n`;
      }
      body += '\n';
    }

    const articles = sortDocs('articles');
    if (articles.length) {
      body += `## 아티클 (설계 판단 참고)\n\n`;
      body += `기본 구현에서는 열지 않고, 경계 판단이나 트레이드오프가 애매하거나 설계 근거를 설명해야 할 때만 참고합니다.\n\n`;
      for (const doc of articles) {
        const summary = doc.meta.summary ? `: ${doc.meta.summary}` : '';
        body += `- [${doc.meta.title ?? doc.slug}](${relOf(doc)})${maturityTag(doc)}${summary}\n`;
      }
      body += '\n';
    }

    body += `${MATURITY_GUIDE}\n`;
    out.set(to, body);
  }

  return out;
}
