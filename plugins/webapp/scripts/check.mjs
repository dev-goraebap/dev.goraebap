import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { OUT, buildContentSkill, contentSkillNames } from './content-skills.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
// 두 곳을 검사한다. skills/는 content에 없는 지침의 원본이고, OUT(goraebap-webapp)은 content에서 만든 스킬이다.
const SKILLS = path.join(root, 'skills');
const MOVED = await contentSkillNames();

let skills = 0;
let links = 0;
let sections = 0;
let exampleLinks = 0;
let anchors = 0;
let examples = 0;
let pure = 0;

// 제목을 GitHub 방식의 앵커로 바꾼다. 한글은 그대로 두고 문장부호를 빼고 빈칸을 하이픈으로 바꾼다.
const toAnchor = heading =>
  heading.trim().toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/\s+/g, '-');

// 공통 지침에는 프레임워크/스택 이름과 특정 예시 프로젝트 이름을 두지 않는다.
const STACK =
  /\b(React|TanStack|Vite|Spring|jOOQ|Flyway|shadcn|Tailwind|Base UI|Tiptap|Lombok|SQLite|PostgreSQL|Java|Gradle|Storybook|Angular|NestJS|HTMX)\b/;
const EXAMPLE_PROJECT_REF = /\bcowork\b/i;
const GITHUB_PINNED_LINK = /^https:\/\/github\.com\/[^/]+\/[^/]+\/(?:blob|tree)\/([0-9a-f]{40})\/([^#?]+)/;
const GITHUB_UNPINNED_BLOB = /^https:\/\/github\.com\/[^/]+\/[^/]+\/(?:blob|tree)\/(?!([0-9a-f]{40})\/)/;

// 자동 생성되는 스택 파일 안내 줄(예: "스택별 구현: react-tanstack.md · angular.md")은 순수성 검사에서 제외한다.
const GENERATED_STACK_NAV = /^(?:-\s+)?스택별 구현(?: 파일)?:/;

function checkPure(file, content, allowStackNav = false) {
  const lines = content.split('\n');
  const line = lines.findIndex(each => {
    if (allowStackNav && GENERATED_STACK_NAV.test(each.trim())) return false;
    return (
      STACK.test(each) ||
      EXAMPLE_PROJECT_REF.test(each) ||
      each.includes('github.com/dev-goraebap/cowork')
    );
  });
  assert(
    line < 0,
    `핵심 지침에는 스택 이름·예시 프로젝트 참조를 두지 않습니다(스택 파일로 옮김): ${file}:${line + 1} ${lines[line]?.trim().slice(0, 80)}`,
  );
  pure++;
}

// 꼬리 구획은 이 이름과 순서로 파일 맨 끝에만 둔다(글쓰기 기준의 「참고 문서의 구획」).
const TAILS = ['작업 절차'];
function checkSections(file, content) {
  const headings = [...content.matchAll(/^## (.+)$/gm)].map(match => match[1].trim());
  const tails = headings.filter(heading => TAILS.includes(heading));
  assert.deepEqual(headings.slice(headings.length - tails.length), tails, `꼬리 구획은 파일 맨 끝에만 둡니다: ${file}`);
  assert.deepEqual(
    tails,
    TAILS.filter(tail => tails.includes(tail)),
    `꼬리 구획 순서는 ${TAILS.join(' → ')}입니다: ${file}`,
  );
  sections++;
}

// 예시 파일 및 스택 구현 파일 이름 목록
export const STACKS = ['react', 'react-tanstack', 'angular', 'spring', 'springboot', 'nestjs'];

function checkExample(file, content) {
  assert(/^# .+$/m.test(content), `예시 제목이 없습니다: ${file}`);
  const parts = content.split(/^## /m).slice(1);
  assert(parts.length > 0, `예시에 스택 절이 없습니다: ${file}`);
  for (const section of parts) {
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
    if (entry.isDirectory()) {
      await checkDir(file, mode, base);
      continue;
    }
    if (!file.endsWith('.md')) continue;
    const content = await fs.readFile(file, 'utf8');
    const isStackFile = STACKS.includes(path.basename(file, '.md'));
    const isRootSkillEntry = mode === 'content' && file === path.join(OUT, 'SKILL.md');

    if (mode === 'content') {
      // 공통 글(index.md, 영역 README)에는 스택 이름을 두지 않는다. 스택 글(<스택>.md)과 루트 SKILL.md(스택 파일 안내)는 제외.
      if (!isStackFile && !isRootSkillEntry) checkPure(file, content, true);
      else if (isStackFile) assert(/^## .+$/m.test(content), `스택 글에 절이 없습니다: ${file}`);
    } else {
      checkSections(file, content);
    }

    const isExample = mode === 'skills' ? path.basename(directory) === 'examples' : isStackFile;
    if (isExample && mode === 'skills') checkExample(file, content);
    if (mode === 'skills' && !isExample) {
      checkPure(file, content);
      if (entry.name === 'SKILL.md') {
        const frontmatter = /^---\r?\nname: ([a-z0-9]+(?:-[a-z0-9]+)*)\r?\ndescription: ([^\r\n]+)\r?\n---/.exec(
          content,
        );
        assert(frontmatter, `스킬 frontmatter가 잘못됐습니다: ${file}`);
        assert.equal(frontmatter[1], path.basename(directory));
        assert(frontmatter[1].length <= 64);
        assert(content.split('\n').length < 500);
        skills++;
      }
    }

    // 코드 펜스 내부는 마크다운 링크 검사에서 제외한다.
    const withoutCode = content.replace(/```[\s\S]*?```/g, '');
    for (const [, href] of withoutCode.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      if (isExample) {
        if (GITHUB_PINNED_LINK.test(href)) {
          exampleLinks++;
          continue;
        }
        assert(!GITHUB_UNPINNED_BLOB.test(href), `예시의 GitHub 코드 링크는 40자리 고정 커밋 주소여야 합니다: ${file} (${href})`);
      }
      assert(
        isExample || !href.includes('github.com/dev-goraebap/dev.goraebap/'),
        `이 저장소에는 예시 원본 코드가 없습니다. 원본 저장소의 고정 커밋으로 겁니다: ${file} (${href})`,
      );
      if (/^(https?:|mailto:|#)/.test(href)) continue;
      const target = path.resolve(directory, href.split('#')[0]);
      assert(!path.relative(base, target).startsWith('..'), `외부 로컬 링크: ${file} (${href})`);
      const exists = await fs.access(target).then(
        () => true,
        () => false,
      );
      if (!exists && mode === 'skills' && MOVED.has(path.relative(SKILLS, target).split(path.sep)[0])) {
        links++;
        continue;
      }
      assert(exists, `없는 파일을 가리킵니다: ${file} (${href})`);
      const anchor = href.split('#')[1];
      if (anchor && target.endsWith('.md')) {
        const headings = [...(await fs.readFile(target, 'utf8')).matchAll(/^#+ (.+)$/gm)].map(([, heading]) =>
          toAnchor(heading),
        );
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
    if (entry.isDirectory()) await listFiles(file, out);
    else out.push(path.relative(OUT, file).split(path.sep).join('/'));
  }
  return out;
}
for (const space of spaces) {
  for (const file of await listFiles(path.join(OUT, 'references', space))) {
    if (!files.has(file)) stale.push(file);
  }
}
assert(
  !stale.length,
  `goraebap-webapp이 content와 다릅니다. plugins/webapp에서 npm run build를 실행합니다: ${stale.join(', ')}`,
);
await checkDir(OUT, 'content', OUT);
const outFiles = files.size;

process.stdout.write(
  `goraebap-webapp ${outFiles}개 파일 최신, ${skills}개 스킬, ${links}개 로컬 링크, 앵커 ${anchors}개, 예시 ${examples}개와 고정 커밋 링크 ${exampleLinks}개, ${sections}개 문서의 꼬리 구획, ${pure}개 지침의 스택·예시 프로젝트 없음 확인\n`,
);
