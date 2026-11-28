// Claude Code · Codex · Antigravity용 fullstack 플러그인을 plugins/fullstack/dist/에 빌드한다.
// 내부 스킬(frontend-uiux, frontend-engineering, backend-engineering)은 모두 명시 호출 전용으로 설정한다.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { REPO, SKILL_NAMES, buildContentSkills } from './content-skills.mjs';

export const ROOT = fileURLToPath(new URL('../', import.meta.url));
export const DIST = path.join(ROOT, 'dist');
export const AGENTS = ['claude', 'codex', 'antigravity'];
export const EXPLICIT_ONLY_SKILLS = [...SKILL_NAMES];

const pkg = JSON.parse(await fs.readFile(path.join(ROOT, 'package.json'), 'utf8'));
const PLUGIN_NAME = pkg.name;
const DISPLAY_NAME = 'Fullstack';
const DESCRIPTION = '웹 앱 풀스택 개발 지침(프론트엔드 UI/UX·프론트엔드 엔지니어링·백엔드 엔지니어링)과 스택별 구현 기준';
const MARKETPLACE_NAME = 'dev-goraebap';
const HOMEPAGE_URL = 'https://dev.goraebap.xyz';
const REPO_URL = 'https://github.com/dev-goraebap/dev.goraebap';
const ANTIGRAVITY_EXPLICIT_PREFIX = '사용자가 명시적으로 호출했을 때만 사용합니다. ';

const json = value => `${JSON.stringify(value, null, 2)}\n`;

function addClaudeExplicitLock(skillMd) {
  return skillMd.replace(/^---(\r?\n)/, '$&disable-model-invocation: true$1');
}

function addAntigravityExplicitNote(skillMd) {
  return skillMd.replace(/^description: "([^"]+)"/m, (_, desc) => {
    const next = desc.startsWith(ANTIGRAVITY_EXPLICIT_PREFIX) ? desc : `${ANTIGRAVITY_EXPLICIT_PREFIX}${desc}`;
    return `description: ${JSON.stringify(next)}`;
  });
}

/** 저장소 루트에 커밋하는 마켓플레이스 파일 맵(레포 루트 기준 경로 → 내용). */
export function buildRootMarketplaces() {
  const files = new Map();
  files.set(
    '.claude-plugin/marketplace.json',
    json({
      name: MARKETPLACE_NAME,
      description: DESCRIPTION,
      owner: { name: MARKETPLACE_NAME },
      plugins: [
        {
          name: PLUGIN_NAME,
          source: `./plugins/${PLUGIN_NAME}/dist/claude/plugins/${PLUGIN_NAME}`,
          description: DESCRIPTION,
        },
      ],
    }),
  );
  files.set(
    '.agents/plugins/marketplace.json',
    json({
      name: MARKETPLACE_NAME,
      interface: { displayName: '데브 고래밥' },
      plugins: [
        {
          name: PLUGIN_NAME,
          source: {
            source: 'local',
            path: `./plugins/${PLUGIN_NAME}/dist/codex/plugins/${PLUGIN_NAME}`,
          },
          policy: {
            installation: 'AVAILABLE',
            authentication: 'ON_INSTALL',
          },
          category: 'Productivity',
        },
      ],
    }),
  );
  return files;
}

/** plugins/fullstack/dist/ 기준 상대 경로 → 파일 내용 맵을 생성한다. */
export async function buildPluginTree() {
  const contentSkills = await buildContentSkills();
  const usageDoc = (await fs.readFile(path.join(ROOT, 'docs/plugin-usage.md'), 'utf8')).replace(/\r\n/g, '\n');
  const files = new Map();

  for (const agent of AGENTS) {
    const pluginPath = `${agent}/plugins/${PLUGIN_NAME}`;

    for (const [relPath, content] of contentSkills) {
      let body = content;
      const skillName = relPath.split('/')[0];
      const isSkillEntry = relPath === `${skillName}/SKILL.md`;
      if (isSkillEntry && EXPLICIT_ONLY_SKILLS.includes(skillName)) {
        if (agent === 'claude') body = addClaudeExplicitLock(body);
        else if (agent === 'antigravity') body = addAntigravityExplicitNote(body);
      }
      files.set(`${pluginPath}/skills/${relPath}`, body);
    }

    if (agent === 'codex') {
      for (const skillName of EXPLICIT_ONLY_SKILLS) {
        files.set(`${pluginPath}/skills/${skillName}/agents/openai.yaml`, 'policy:\n  allow_implicit_invocation: false\n');
      }
    }

    files.set(`${pluginPath}/README.md`, usageDoc);

    if (agent === 'antigravity') {
      files.set(
        `${pluginPath}/plugin.json`,
        json({
          name: PLUGIN_NAME,
          displayName: DISPLAY_NAME,
          version: pkg.version,
          description: DESCRIPTION,
          author: { name: MARKETPLACE_NAME },
          homepage: HOMEPAGE_URL,
          repository: { type: 'git', url: REPO_URL },
          suggestedPrompts: [
            'frontend-uiux 스킬 기준으로 이 화면 레이아웃과 컴포넌트를 검토해 줘',
            'frontend-engineering 스킬 기준으로 새 페이지와 상태 흐름을 설계해 줘',
            'backend-engineering 스킬 기준으로 API와 데이터 접근 계층을 구현해 줘',
          ],
        }),
      );
      continue;
    }

    const manifest = {
      name: PLUGIN_NAME,
      version: pkg.version,
      description: DESCRIPTION,
      author: { name: MARKETPLACE_NAME },
      skills: './skills/',
    };
    if (agent === 'codex') {
      manifest.requires_local_executor = true;
      manifest.interface = {
        displayName: DISPLAY_NAME,
        shortDescription: DESCRIPTION,
        developerName: MARKETPLACE_NAME,
      };
    }

    files.set(`${pluginPath}/.${agent}-plugin/plugin.json`, json(manifest));
    files.set(`${pluginPath}/package.json`, json({ name: PLUGIN_NAME, version: pkg.version, private: true, type: 'module' }));

    if (agent === 'claude') {
      files.set(
        `${agent}/.claude-plugin/marketplace.json`,
        json({
          name: MARKETPLACE_NAME,
          description: DESCRIPTION,
          owner: { name: MARKETPLACE_NAME },
          plugins: [{ name: PLUGIN_NAME, source: `./plugins/${PLUGIN_NAME}`, description: DESCRIPTION }],
        }),
      );
    } else {
      files.set(
        `${agent}/.agents/plugins/marketplace.json`,
        json({
          name: MARKETPLACE_NAME,
          interface: { displayName: '데브 고래밥' },
          plugins: [
            {
              name: PLUGIN_NAME,
              source: { source: 'local', path: `./plugins/${PLUGIN_NAME}` },
              policy: { installation: 'AVAILABLE', authentication: 'ON_INSTALL' },
              category: 'Productivity',
            },
          ],
        }),
      );
    }
  }

  return files;
}

async function writeAtomic(destination, content) {
  await fs.mkdir(path.dirname(destination), { recursive: true });
  const next = `${destination}.next`;
  await fs.writeFile(next, content, 'utf8');
  await fs.rename(next, destination);
}

export async function packagePlugins() {
  const dist = path.resolve(DIST);
  try {
    const stat = await fs.lstat(dist);
    if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error('dist는 일반 폴더여야 합니다.');
    if (path.dirname(dist) !== path.resolve(ROOT)) throw new Error('잘못된 dist 경로입니다.');
    await fs.rm(dist, { recursive: true });
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  const distFiles = await buildPluginTree();
  for (const [relPath, content] of distFiles) {
    await writeAtomic(path.join(dist, relPath), content);
  }

  const rootMarketplaces = buildRootMarketplaces();
  for (const [relPath, content] of rootMarketplaces) {
    await writeAtomic(path.join(REPO, relPath), content);
  }

  return { dist, distCount: distFiles.size, marketplaceCount: rootMarketplaces.size };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { distCount, marketplaceCount } = await packagePlugins();
  process.stdout.write(
    `${path.relative(REPO, DIST)}에 ${distCount}개 파일, 루트 마켓플레이스 ${marketplaceCount}개 파일을 만들었습니다\n`,
  );
}
