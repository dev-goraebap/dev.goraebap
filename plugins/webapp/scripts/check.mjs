import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const SKILLS = path.join(root, 'skills');
const ADAPTERS = path.join(root, 'adapters');

let skills = 0;
let links = 0;
let sections = 0;
let adapterLinks = 0;
let pure = 0;

// 핵심 지침(skills/)은 스택·특정 어댑터 없이 판단 기준만 담는다.
// 스택 이름과 프로젝트 코드 링크는 adapters/<프로젝트>/에만 둔다.
const STACK = /\b(React|TanStack|Vite|Spring|jOOQ|Flyway|shadcn|Tailwind|Base UI|Tiptap|Lombok|SQLite|PostgreSQL|TypeScript|Java|Gradle|Storybook|Angular|NestJS|HTMX)\b/;
const ADAPTER_PROJECT_REF = /\bcowork\b/i;
const GITHUB_PINNED_LINK = /^https:\/\/github\.com\/[^/]+\/[^/]+\/(?:blob|tree)\/([0-9a-f]{40})\/([^#?]+)/;
const GITHUB_UNPINNED_BLOB = /^https:\/\/github\.com\/[^/]+\/[^/]+\/(?:blob|tree)\/(?!([0-9a-f]{40})\/)/;

function checkPure(file, content) {
  const lines = content.split('\n');
  const line = lines.findIndex(each =>
    STACK.test(each)
    || ADAPTER_PROJECT_REF.test(each)
    || each.includes('github.com/dev-goraebap/cowork'),
  );
  assert(line < 0, `핵심 지침에는 스택 이름·어댑터 프로젝트 참조를 두지 않습니다(adapters/로 옮김): ${file}:${line + 1} ${lines[line]?.trim().slice(0, 80)}`);
  pure++;
}

// 아키텍처 정의서(arc42)의 절: 1~9와 8절의 하위 절. 결정 기록(docs/decisions.md)과 같은 절 구성이다.
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

async function checkDir(directory, mode) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    assert(!entry.isSymbolicLink(), `링크 파일은 배포하지 않습니다: ${file}`);
    if (entry.isDirectory()) { await checkDir(file, mode); continue; }
    if (!file.endsWith('.md')) continue;
    const content = await fs.readFile(file, 'utf8');
    checkSections(file, content);
    if (mode === 'skills') {
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
      if (mode === 'adapters') {
        if (GITHUB_PINNED_LINK.test(href)) { adapterLinks++; continue; }
        assert(!GITHUB_UNPINNED_BLOB.test(href), `어댑터의 GitHub 코드 링크는 40자리 고정 커밋 주소여야 합니다: ${file} (${href})`);
      }
      assert(!href.includes('github.com/dev-goraebap/dev.goraebap/'), `이 저장소에는 예제 코드가 없습니다. 어댑터의 원본 저장소 링크로 겁니다: ${file} (${href})`);
      if (/^(https?:|#)/.test(href)) continue;
      const target = path.resolve(directory, href.split('#')[0]);
      assert(!path.relative(root, target).startsWith('..'), `외부 로컬 링크: ${file} (${href})`);
      await fs.access(target);
      links++;
    }
    assert(!content.includes('.local/'), `로컬 참고 자료를 배포 스킬이 읽으면 안 됩니다: ${file}`);
  }
}

await checkDir(SKILLS, 'skills');
await checkDir(ADAPTERS, 'adapters');
process.stdout.write(`${skills}개 스킬, ${links}개 로컬 링크, ${adapterLinks}개 어댑터 고정 커밋 링크, ${sections}개 문서의 arc42·구획, ${pure}개 지침의 스택·어댑터 없음 확인\n`);
