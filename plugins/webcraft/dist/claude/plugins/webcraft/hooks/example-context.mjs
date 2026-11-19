// 프로젝트 예제 알림(세션 시작 훅). 프로젝트 AGENTS.md의 `Webcraft 예제: <이름>` 줄을 읽어, 그 예제가 플러그인에
// 있으면 지침과 함께 읽을 예제 파일 목록을 에이전트 맥락에 넣는다. 지침은 스택 없는 규칙만 담고 스택·구현은 예제에
// 있으므로, 예제를 빠뜨리지 않게 하는 장치다. 줄이 없거나 파일 오류가 나면 조용히 넘긴다.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const EXAMPLE_LINE = /^\s*[-*]?\s*Webcraft 예제\s*:\s*`?([a-z0-9][a-z0-9-]*)`?/m;

/** AGENTS.md 본문에서 예제 이름을 읽는다. 없으면 null. */
export function exampleName(agents) {
  return EXAMPLE_LINE.exec(agents ?? '')?.[1] ?? null;
}

/** 예제 이름과 그 폴더의 파일 목록으로 훅 출력(JSON)을 만든다. 파일이 없으면 null. */
export function context(name, files, examplesDir) {
  if (!name || !files?.length) return null;
  const list = files.filter(file => file.endsWith('.md')).sort().map(file => `- ${path.join(examplesDir, name, file)}`);
  if (!list.length) return null;
  return {
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext: [
        `이 프로젝트는 Webcraft 예제 \`${name}\`을 따릅니다(AGENTS.md의 "Webcraft 예제" 줄).`,
        'Webcraft 지침은 스택 없는 규칙만 담습니다. 영역 지침(frontend · design-system · backend · api · database · architecture)을 읽을 때마다',
        '이 예제에서 같은 영역의 파일을 함께 읽고, 작업 보고에 읽은 지침과 예제 파일을 적습니다. 예제와 이 프로젝트의 AGENTS.md가 다르면 AGENTS.md를 따릅니다.',
        ...list,
      ].join('\n'),
    },
  };
}

async function main() {
  const root = process.env.CLAUDE_PLUGIN_ROOT ?? fileURLToPath(new URL('../', import.meta.url));
  const project = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
  const agents = await fs.readFile(path.join(project, 'AGENTS.md'), 'utf8').catch(() => null);
  const name = exampleName(agents);
  if (!name) return;
  const examplesDir = path.join(root, 'skills', 'goraebap-mode', 'examples');
  const files = await fs.readdir(path.join(examplesDir, name)).catch(() => []);
  const output = context(name, files, examplesDir);
  if (output) process.stdout.write(`${JSON.stringify(output)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main().catch(() => undefined);
}
