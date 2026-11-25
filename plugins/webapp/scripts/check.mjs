import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { OUT, buildContentSkill, contentSkillNames } from './content-skills.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
// 두 곳을 검사한다. skills/는 content에 없는 지침의 원본이고, OUT(goraebap-webapp)은 content에서 만든 스킬이다.
// content를 만들 때 Slot·Fill 짝과 스택 파일 이름, 스킬 밖 링크를 확인하고, 아래 검사가 나머지(만든 결과가 최신인지, 스택 이름, 링크, 앵커, 예시 형식)를 본다.
const SKILLS = path.join(root, 'skills');
const MOVED = await contentSkillNames();

let skills = 0;
let links = 0;
let sections = 0;
let exampleLinks = 0;
let anchors = 0;

// 제목을 GitHub 방식의 앵커로 바꾼다. 한글은 그대로 두고 문장부호를 빼고 빈칸을 하이픈으로 바꾼다.
const toAnchor = (heading) => heading.trim().toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/\s+/g, '-');
let examples = 0;
let pure = 0;

// 핵심 지침(skills/)은 스택·특정 프로젝트 없이 판단 기준만 담는다.
// 스택 이름과 프로젝트 코드는 각 스킬의 examples/ 예시 파일에만 둔다.
const STACK = /\b(React|TanStack|Vite|Spring|jOOQ|Flyway|shadcn|Tailwind|Base UI|Tiptap|Lombok|SQLite|PostgreSQL|TypeScript|Java|Gradle|Storybook|Angular|NestJS|HTMX)\b/;
const EXAMPLE_PROJECT_REF = /\bcowork\b/i;
const GITHUB_PINNED_LINK = /^https:\/\/github\.com\/[^/]+\/[^/]+\/(?:blob|tree)\/([0-9a-f]{40})\/([^#?]+)/;
const GITHUB_UNPINNED_BLOB = /^https:\/\/github\.com\/[^/]+\/[^/]+\/(?:blob|tree)\/(?!([0-9a-f]{40})\/)/;

function checkPure(file, content) {
  const lines = content.split('\n');
  const line = lines.findIndex(each =>
    STACK.test(each)
    || EXAMPLE_PROJECT_REF.test(each)
    || each.includes('github.com/dev-goraebap/cowork'),
  );
  assert(line < 0, `핵심 지침에는 스택 이름·예시 프로젝트 참조를 두지 않습니다(examples/로 옮김): ${file}:${line + 1} ${lines[line]?.trim().slice(0, 80)}`);
  pure++;
}

// 아키텍처 정의서(arc42)의 절: 1~9와 8절의 하위 절.
const ARC42 = /^([1-79]|8\.[1-9])$/;
// 꼬리 구획은 이 이름과 순서로 파일 맨 끝에만 둔다(글쓰기 기준의 「참고 문서의 구획」).
const TAILS = ['작업 절차'];
function checkSections(file, content) {
  const front = /^---\r?\n([\s\S]*?)\r?\n---/.exec(content)?.[1] ?? '';
  const value = /^arc42: "([^"]+)"\r?$/m.exec(front)?.[1];
  assert(value, `arc42 프론트매터가 없습니다: ${file}`);
  if (value !== 'none') for (const part of value.split(',').map(item => item.trim()))
    assert(ARC42.test(part), `arc42 값은 1~9 또는 8.1~8.9, 해당 없으면 none입니다: ${file} (${part})`);
  const headings = [...content.matchAll(/^## (.+)$/gm)].map(match => match[1].trim());
  const tails = headings.filter(heading => TAILS.includes(heading));
  assert.deepEqual(headings.slice(headings.length - tails.length), tails, `꼬리 구획은 파일 맨 끝에만 둡니다: ${file}`);
  assert.deepEqual(tails, TAILS.filter(tail => tails.includes(tail)), `꼬리 구획 순서는 ${TAILS.join(' → ')}입니다: ${file}`);
  sections++;
}

// 예시 파일: 절 제목은 스택 id이고, 절마다 출처 링크와 코드 블록이 있다. 사이트도 같은 형식을 읽는다.
export const STACKS = ['react', 'angular', 'spring'];
function checkExample(file, content) {
  assert(/^# .+$/m.test(content), `예시 제목이 없습니다: ${file}`);
  const sections = content.split(/^## /m).slice(1);
  assert(sections.length > 0, `예시에 스택 절이 없습니다: ${file}`);
  for (const section of sections) {
    const stack = section.slice(0, section.indexOf('\n')).trim();
    assert(STACKS.includes(stack), `예시 절 제목은 스택 id(${STACKS.join(', ')})여야 합니다: ${file} (${stack})`);
    assert(/^출처: \[[^\]]+\]\(https:\/\/github\.com\//m.test(section), `예시 절에 출처 링크가 없습니다: ${file} (${stack})`);
    assert(/^```[a-z]+$/m.test(section), `예시 절에 언어를 적은 코드 블록이 없습니다: ${file} (${stack})`);
  }
  examples++;
}

async function checkDir(directory, mode, base = SKILLS) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    assert(!entry.isSymbolicLink(), `링크 파일은 배포하지 않습니다: ${file}`);
    if (entry.isDirectory()) { await checkDir(file, mode, base); continue; }
    if (!file.endsWith('.md')) continue;
    const content = await fs.readFile(file, 'utf8');
    if (mode === 'content') {
      // 공통 글(index.md, 영역 README, 스킬 SKILL.md)에는 스택 이름을 두지 않는다. 스택 글(<스택>.md)에만 둔다.
      if (!STACKS.includes(path.basename(file, '.md'))) checkPure(file, content);
      else assert(/^## .+$/m.test(content), `스택 글에 절이 없습니다: ${file}`);
    } else checkSections(file, content);
    // 예시: skills/<스킬>/examples/의 파일과, content에서 만든 스택 글(<스택>.md)
    const isExample = mode === 'skills' ? path.basename(directory) === 'examples' : STACKS.includes(path.basename(file, '.md'));
    if (isExample && mode === 'skills') checkExample(file, content);
    if (mode === 'skills' && !isExample) {
      checkPure(file, content);
      if (entry.name === 'SKILL.md') {
        const frontmatter = /^---\r?\nname: ([a-z0-9]+(?:-[a-z0-9]+)*)\r?\ndescription: ([^\r\n]+)\r?\n(?:arc42: "[^"]+"\r?\n)?---/.exec(content);
        assert(frontmatter, `스킬 frontmatter가 잘못됐습니다: ${file}`);
        assert.equal(frontmatter[1], path.basename(directory));
        assert(frontmatter[1].length <= 64);
        assert(content.split('\n').length < 500);
        skills++;
      }
    }
    for (const [, href] of content.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      if (isExample) {
        if (GITHUB_PINNED_LINK.test(href)) { exampleLinks++; continue; }
        assert(!GITHUB_UNPINNED_BLOB.test(href), `예시의 GitHub 코드 링크는 40자리 고정 커밋 주소여야 합니다: ${file} (${href})`);
      }
      assert(isExample || !href.includes('github.com/dev-goraebap/dev.goraebap/'), `이 저장소에는 예시 원본 코드가 없습니다. 원본 저장소의 고정 커밋으로 겁니다: ${file} (${href})`);
      if (/^(https?:|#)/.test(href)) continue;
      const target = path.resolve(directory, href.split('#')[0]);
      assert(!path.relative(base, target).startsWith('..'), `외부 로컬 링크: ${file} (${href})`);
      // content에 있는 지침 이름으로 skills/ 안의 없는 파일을 가리키면 사이트가 그 지침의 페이지로 잇는다. 있는 파일이면 그대로 확인한다.
      const exists = await fs.access(target).then(() => true, () => false);
      if (!exists && mode === 'skills' && MOVED.has(path.relative(SKILLS, target).split(path.sep)[0])) { links++; continue; }
      assert(exists, `없는 파일을 가리킵니다: ${file} (${href})`);
      const anchor = href.split('#')[1];
      if (anchor && target.endsWith('.md')) {
        const headings = [...(await fs.readFile(target, 'utf8')).matchAll(/^#+ (.+)$/gm)].map(([, heading]) => toAnchor(heading));
        assert(headings.includes(decodeURIComponent(anchor)), `없는 제목을 가리키는 앵커입니다: ${file} (${href})`);
        anchors++;
      }
      links++;
    }
    assert(!content.includes('.local/'), `로컬 참고 자료를 배포 스킬이 읽으면 안 됩니다: ${file}`);
  }
}

await checkDir(SKILLS, 'skills');

// content에서 만든 결과가 커밋된 OUT과 같아야 한다. 다르면 npm run build로 다시 만든다.
const { files, spaces } = await buildContentSkill();
const stale = [];
for (const [file, content] of files) {
  const current = await fs.readFile(path.join(OUT, file), 'utf8').catch(() => null);
  if (current?.replace(/\r\n/g, '\n') !== content) stale.push(file);
}
async function listFiles(directory, out = []) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true }).catch(() => [])) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) await listFiles(file, out); else out.push(path.relative(OUT, file).split(path.sep).join('/'));
  }
  return out;
}
for (const space of spaces)
  for (const file of await listFiles(path.join(OUT, 'references', space))) if (!files.has(file)) stale.push(file);
assert(!stale.length, `goraebap-webapp이 content와 다릅니다. plugins/webapp에서 npm run build를 실행합니다: ${stale.join(', ')}`);
await checkDir(OUT, 'content', OUT);
const outFiles = files.size;

process.stdout.write(`goraebap-webapp ${outFiles}개 파일 최신, ${skills}개 스킬, ${links}개 로컬 링크, 앵커 ${anchors}개, 예시 ${examples}개와 고정 커밋 링크 ${exampleLinks}개, ${sections}개 문서의 arc42·구획, ${pure}개 지침의 스택·예시 프로젝트 없음 확인\n`);
