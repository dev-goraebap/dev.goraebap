// Webcraft 새 판 알림(세션 시작 훅). 설치된 판과 원본 저장소의 최신 판을 하루 한 번 비교해, 낮으면 사용자에게 한 줄로
// 알리고 에이전트에게는 갱신을 제안·실행하는 방법을 맥락으로 준다. 네트워크·파일 오류는 조용히 넘긴다: 알림이 실패해도
// 세션 시작을 막거나 경고를 남기지 않는다.
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const LATEST_URL = 'https://raw.githubusercontent.com/dev-goraebap/dev.goraebap/main/plugins/webcraft/package.json';
const DAY = 24 * 60 * 60 * 1000;

/** 점으로 나눈 숫자 판을 비교한다. a가 b보다 높으면 양수. 숫자가 아닌 꼬리(-rc 등)는 무시한다. */
export function compareVersions(a, b) {
  const parts = value => String(value).split('-')[0].split('.').map(part => Number.parseInt(part, 10) || 0);
  const [x, y] = [parts(a), parts(b)];
  for (let i = 0; i < Math.max(x.length, y.length); i += 1) {
    const diff = (x[i] ?? 0) - (y[i] ?? 0);
    if (diff) return diff;
  }
  return 0;
}

/** 새 판이 있으면 훅 출력(JSON)을, 없으면 null을 돌려준다. */
export function notice(installed, latest) {
  if (!installed || !latest || compareVersions(latest, installed) <= 0) return null;
  return {
    systemMessage: `Webcraft 새 판이 나왔습니다(${installed} → ${latest}). 에이전트에게 "Webcraft 업데이트해 줘"라고 하면 갱신합니다.`,
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext: [
        `Webcraft 플러그인의 새 판이 있습니다(설치된 판 ${installed}, 최신 판 ${latest}).`,
        '사용자의 첫 요청을 처리하기 전에 한 번만 갱신을 제안합니다. 사용자가 동의하면 아래 두 명령을 차례로 실행합니다.',
        '`claude plugin marketplace update dev-goraebap`',
        '`claude plugin update webcraft@dev-goraebap`',
        '성공하면 `/reload-plugins`를 입력하면 바로 적용되고, 아니면 다음 세션부터 적용된다고 안내합니다.',
        '작업 중이라 지금 갱신하지 않기로 하면 다시 묻지 않고 하던 작업을 이어갑니다.',
      ].join('\n'),
    },
  };
}

async function readJson(file) {
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

/** 하루 안에 확인한 최신 판이 캐시에 있으면 그것을, 없으면 원본에서 받아 캐시에 남긴다. 실패하면 null. */
async function latestVersion(cacheFile, now = Date.now()) {
  const cached = await readJson(cacheFile).catch(() => null);
  if (cached?.latest && now - cached.checkedAt < DAY) return cached.latest;
  try {
    const response = await fetch(LATEST_URL, { signal: AbortSignal.timeout(3000) });
    if (!response.ok) return cached?.latest ?? null;
    const { version } = await response.json();
    await fs.mkdir(path.dirname(cacheFile), { recursive: true });
    await fs.writeFile(cacheFile, JSON.stringify({ latest: version, checkedAt: now }));
    return version;
  } catch {
    return cached?.latest ?? null;
  }
}

async function main() {
  const root = process.env.CLAUDE_PLUGIN_ROOT ?? fileURLToPath(new URL('../', import.meta.url));
  const installed = (await readJson(path.join(root, '.claude-plugin', 'plugin.json')).catch(() => null))?.version;
  const latest = await latestVersion(path.join(os.homedir(), '.goraebap', 'cache', 'webcraft-latest.json'));
  const output = notice(installed, latest);
  if (output) process.stdout.write(`${JSON.stringify(output)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main().catch(() => undefined);
}
