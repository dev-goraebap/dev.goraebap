import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { parse as parseYaml } from 'yaml';
import { REPO, SKILL_NAMES } from './content-skills.mjs';
import {
  AGENTS,
  ALL_SKILL_NAMES,
  DIST,
  EXPLICIT_ONLY_SKILLS,
  buildPluginTree,
  buildRootMarketplaces,
} from './package-plugins.mjs';

const PLUGIN_NAME = 'fullstack';
const STACKS = ['react', 'react-tanstack', 'angular', 'spring', 'springboot', 'nestjs'];
const ANTIGRAVITY_ALLOWED_FIELDS = new Set([
  'name',
  'displayName',
  'version',
  'description',
  'logo',
  'suggestedPrompts',
  'author',
  'homepage',
  'repository',
  'disabled',
]);

// 제목을 GitHub 방식의 앵커로 바꾼다.
const toAnchor = heading =>
  heading.trim().toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/\s+/g, '-');

// 공통 지침에는 프레임워크/스택 이름과 특정 예시 프로젝트 이름을 두지 않는다.
const STACK =
  /\b(React|TanStack|Vite|Spring|jOOQ|Flyway|shadcn|Tailwind|Base UI|Tiptap|Lombok|SQLite|PostgreSQL|Java|Gradle|Storybook|Angular|NestJS|HTMX)\b/;
const EXAMPLE_PROJECT_REF = /\bcowork\b/i;
const GITHUB_PINNED_LINK = /^https:\/\/github\.com\/[^/]+\/[^/]+\/(?:blob|tree)\/([0-9a-f]{40})\/([^#?]+)/;
const GITHUB_UNPINNED_BLOB = /^https:\/\/github\.com\/[^/]+\/[^/]+\/(?:blob|tree)\/(?!([0-9a-f]{40})\/)/;
const GENERATED_STACK_NAV = /^(?:-\s+)?스택별 구현(?: 파일)?:/;
const GENERATED_ARTICLE_LINK = /^-\s+\[[^\]]+\]\(articles\/[^)]+\)/;

let checkedSkills = 0;
let links = 0;
let anchors = 0;
let exampleLinks = 0;
let pure = 0;

function checkPure(file, content) {
  const lines = content.split('\n');
  const line = lines.findIndex(each => {
    const trimmed = each.trim();
    if (GENERATED_STACK_NAV.test(trimmed) || GENERATED_ARTICLE_LINK.test(trimmed)) return false;
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

async function listFiles(directory, base = directory, out = []) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true }).catch(() => [])) {
    const file = path.join(directory, entry.name);
    assert(!entry.isSymbolicLink(), `링크 파일은 배포하지 않습니다: ${file}`);
    if (entry.isDirectory()) await listFiles(file, base, out);
    else out.push(path.relative(base, file).split(path.sep).join('/'));
  }
  return out;
}

// 1) dist 및 루트 마켓플레이스가 최신 빌드 결과와 정확히 일치하는지 검사
const expectedDist = await buildPluginTree();
const stale = [];
for (const [relPath, expected] of expectedDist) {
  const actual = await fs.readFile(path.join(DIST, relPath), 'utf8').catch(() => null);
  if (actual?.replace(/\r\n/g, '\n') !== expected) stale.push(relPath);
}
for (const relPath of await listFiles(DIST)) {
  if (!expectedDist.has(relPath)) stale.push(`extra:${relPath}`);
}
assert(!stale.length, `fullstack 플러그인 dist가 content와 다릅니다. plugins/fullstack에서 npm run build를 실행합니다: ${stale.slice(0, 10).join(', ')}`);

for (const [relPath, expected] of buildRootMarketplaces()) {
  const actual = await fs.readFile(path.join(REPO, relPath), 'utf8').catch(() => null);
  assert.equal(
    actual?.replace(/\r\n/g, '\n'),
    expected,
    `루트 마켓플레이스 파일이 최신이 아닙니다: ${relPath}`,
  );
}

// 2) 에이전트별 매니페스트·명시 호출 잠금·스킬 문서 품질 검사
async function checkSkillsTree(skillsRoot, agent) {
  const entries = (await fs.readdir(skillsRoot, { withFileTypes: true }))
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort();
  assert.deepEqual(entries, [...ALL_SKILL_NAMES].sort(), `${agent} 스킬 목록이 다릅니다: ${entries.join(', ')}`);

  for (const skillName of ALL_SKILL_NAMES) {
    const skillDir = path.join(skillsRoot, skillName);
    const skillFile = path.join(skillDir, 'SKILL.md');
    const content = (await fs.readFile(skillFile, 'utf8')).replace(/\r\n/g, '\n');
    const match = /^---\n([\s\S]*?)\n---\n/.exec(content);
    assert(match, `SKILL.md frontmatter가 잘못됐습니다: ${skillFile}`);
    const fm = parseYaml(match[1]) ?? {};
    assert.equal(fm.name, skillName, `스킬 name이 폴더명과 다릅니다: ${skillFile}`);
    assert(typeof fm.description === 'string' && fm.description.length > 0, `description이 비었습니다: ${skillFile}`);
    assert(fm.name.length <= 64, `스킬 name이 64자를 넘습니다: ${skillFile}`);
    assert(content.split('\n').length < 500, `SKILL.md가 500줄 이상입니다: ${skillFile}`);

    if (EXPLICIT_ONLY_SKILLS.includes(skillName)) {
      if (agent === 'claude') {
        assert.equal(fm['disable-model-invocation'], true, `Claude 명시 호출 잠금이 없습니다: ${skillFile}`);
      } else if (agent === 'codex') {
        const policyPath = path.join(skillDir, 'agents/openai.yaml');
        const policy = parseYaml(await fs.readFile(policyPath, 'utf8'));
        assert.equal(policy?.policy?.allow_implicit_invocation, false, `Codex 명시 호출 잠금이 없습니다: ${policyPath}`);
      } else if (agent === 'antigravity') {
        assert(fm.description.includes('명시적으로 호출'), `Antigravity 명시 호출 안내가 없습니다: ${skillFile}`);
      }
    }
    // content 기반 스킬 직하에 playbooks/와 reference/가 평탄하게 배치되어 있는지 확인
    if (SKILL_NAMES.includes(skillName)) {
      for (const requiredDir of ['playbooks', 'reference']) {
        const stat = await fs.stat(path.join(skillDir, requiredDir)).catch(() => null);
        assert(stat?.isDirectory(), `${agent}/${skillName} 아래에 ${requiredDir}/ 폴더가 없습니다.`);
      }
    }
    checkedSkills++;
  }

  // claude 산출물을 기준으로 전체 마크다운 링크·앵커·순수성 검사 (3개 에이전트 본문 동일)
  if (agent !== 'claude') return;

  async function walk(directory, skillRoot) {
    for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        await walk(file, skillRoot);
        continue;
      }
      if (!file.endsWith('.md')) continue;
      const content = (await fs.readFile(file, 'utf8')).replace(/\r\n/g, '\n');
      const isStackFile = STACKS.includes(path.basename(file, '.md'));
      const relFromSkill = path.relative(skillRoot, file).split(path.sep).join('/');
      const isArticle = relFromSkill.startsWith('articles/');

      if (!isStackFile && !isArticle) checkPure(file, content);
      else if (isStackFile) assert(/^## .+$/m.test(content), `스택 글에 절이 없습니다: ${file}`);

      const withoutCode = content.replace(/```[\s\S]*?```/g, '');
      for (const [, href] of withoutCode.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
        if (isStackFile) {
          if (GITHUB_PINNED_LINK.test(href)) {
            exampleLinks++;
            continue;
          }
          assert(!GITHUB_UNPINNED_BLOB.test(href), `예시의 GitHub 코드 링크는 40자리 고정 커밋 주소여야 합니다: ${file} (${href})`);
        }
        assert(
          isStackFile || !href.includes('github.com/dev-goraebap/dev.goraebap/'),
          `이 저장소에는 예시 원본 코드가 없습니다. 원본 저장소의 고정 커밋으로 겁니다: ${file} (${href})`,
        );
        if (/^(https?:|mailto:|#)/.test(href)) continue;
        const target = path.resolve(directory, href.split('#')[0]);
        assert(!path.relative(skillsRoot, target).startsWith('..'), `플러그인 스킬 외부 로컬 링크: ${file} (${href})`);
        const targetExists = await fs.access(target).then(() => true, () => false);
        assert(targetExists, `없는 파일을 가리킵니다: ${file} (${href})`);
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

  for (const skillName of ALL_SKILL_NAMES) {
    await walk(path.join(skillsRoot, skillName), path.join(skillsRoot, skillName));
  }
}

for (const agent of AGENTS) {
  const pluginDir = path.join(DIST, agent, 'plugins', PLUGIN_NAME);
  if (agent === 'antigravity') {
    const manifest = JSON.parse(await fs.readFile(path.join(pluginDir, 'plugin.json'), 'utf8'));
    assert.equal(manifest.name, PLUGIN_NAME);
    for (const key of Object.keys(manifest)) {
      assert(ANTIGRAVITY_ALLOWED_FIELDS.has(key), `Antigravity plugin.json에 허용되지 않은 필드: ${key}`);
    }
  } else {
    const manifest = JSON.parse(await fs.readFile(path.join(pluginDir, `.${agent}-plugin`, 'plugin.json'), 'utf8'));
    assert.equal(manifest.name, PLUGIN_NAME);
    assert.equal(manifest.skills, './skills/');
  }
  await checkSkillsTree(path.join(pluginDir, 'skills'), agent);
}

process.stdout.write(
  `fullstack 플러그인(${AGENTS.join('·')}) ${expectedDist.size}개 파일 최신, 스킬 ${checkedSkills}개 명시 호출 잠금 확인, 로컬 링크 ${links}개, 앵커 ${anchors}개, 고정 커밋 링크 ${exampleLinks}개, 공통 지침 ${pure}개 순수성 확인\n`,
);
