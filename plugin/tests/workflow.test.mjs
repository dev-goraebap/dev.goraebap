import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { run } from '../manager/scripts/workflow.mjs';
import { packagePlugins } from '../scripts/package-plugins.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
async function fixture(t) {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'goraebap-test-'));
  t.after(async () => {
    assert.equal(path.dirname(temp), os.tmpdir());
    assert(path.basename(temp).startsWith('goraebap-test-'));
    await fs.rm(temp, { recursive: true, force: true });
  });
  const source = path.join(temp, '원본');
  const project = path.join(temp, '팀 프로젝트');
  await fs.mkdir(source);
  await fs.mkdir(project);
  assert.equal(spawnSync('git', ['init', project], { encoding: 'utf8' }).status, 0);
  await fs.cp(path.join(root, 'skills'), path.join(source, 'skills'), { recursive: true });
  await fs.copyFile(path.join(root, 'package.json'), path.join(source, 'package.json'));
  const call = (command, ...args) => run([command, '--project', project, ...args]);
  const install = (...args) => call('install', '--source', source, ...args);
  return { temp, source, project, call, install };
}
const read = file => fs.readFile(file, 'utf8');
const localFile = (project, name = 'backend/SKILL.md') => path.join(project, '.agents/skills', name);
const missing = file => assert.rejects(fs.access(file), { code: 'ENOENT' });

test('온보딩은 에이전트가 불명확하면 쓰지 않고 선택 후 일반 입구와 스킬을 준비한다', async t => {
  const f = await fixture(t);
  assert.equal((await f.call('onboard', '--source', f.source)).status, 'needs-prefix');
  const start = () => f.call('onboard', '--source', f.source, '--prefix', 'demo');
  assert.equal((await start()).status, 'needs-agents');
  await missing(path.join(f.project, '.agents'));
  await missing(path.join(f.project, 'AGENTS.md'));
  const result = await f.call('onboard', '--source', f.source, '--prefix', 'demo', '--agents', 'claude-code,codex');
  assert.equal(result.status, 'installed');
  assert.deepEqual(result.agents, ['claude-code', 'codex']);
  const guidance = await read(path.join(f.project, 'AGENTS.md'));
  assert(guidance.includes('.agents/skills/demo-mode/SKILL.md'));
  assert(!guidance.includes('goraebap-workflow'));
  assert(!guidance.includes(f.source));
  await missing(path.join(f.project, '.grok'));
  await f.call('sync');
  assert.equal((await f.call('sync', '--check')).synchronized, true);
});

test('온보딩은 기존 에이전트를 감지하고 기존 AGENTS·다른 스킬을 보존한다', async t => {
  const f = await fixture(t);
  await fs.mkdir(path.join(f.project, '.codex'));
  await fs.writeFile(path.join(f.project, '.codex/hooks.json'), '{}');
  await fs.writeFile(path.join(f.project, 'AGENTS.md'), '# 팀 규칙\n업무 기록은 팀 문서에 둔다.\n');
  const result = await f.call('onboard', '--source', f.source, '--prefix', 'team');
  assert.equal(result.status, 'installed');
  assert.deepEqual(result.agents, ['codex']);
  assert(result.guidance.suggested.includes('team-mode/SKILL.md'));
  assert.equal(await read(path.join(f.project, 'AGENTS.md')), '# 팀 규칙\n업무 기록은 팀 문서에 둔다.\n');
  await missing(path.join(f.project, '.claude'));
});

test('재호출은 새 원본과 로컬 개선을 자동 병합하지 않고 설치 상태만 읽는다', async t => {
  const f = await fixture(t);
  await f.call('onboard', '--source', f.source, '--prefix', 'demo', '--agents', 'codex');
  await fs.appendFile(localFile(f.project, 'demo-backend/SKILL.md'), '\n팀의 개선\n');
  await fs.appendFile(path.join(f.source, 'skills/backend/SKILL.md'), '\n새 공통 개선\n');
  const lock = path.join(f.project, '.git/goraebap-workflow/lock.json');
  const before = await read(lock);
  const result = await f.call('onboard', '--source', f.source);
  assert.equal(result.status, 'managed');
  assert(result.comparison.changed.some(c => c.file === 'demo-backend/SKILL.md' && c.localChanged));
  assert.equal(await read(lock), before);
  assert(!(await read(localFile(f.project, 'demo-backend/SKILL.md'))).includes('새 공통 개선'));
});

test('관리 기준 없는 기존 지침은 온보딩으로 덮거나 최신 기준으로 등록하지 않는다', async t => {
  const f = await fixture(t);
  await fs.mkdir(path.dirname(localFile(f.project)), { recursive: true });
  await fs.writeFile(localFile(f.project), '기존 백엔드');
  const result = await f.call('onboard', '--source', f.source, '--agents', 'codex');
  assert.equal(result.status, 'existing-skills');
  assert.deepEqual(result.skills, ['backend']);
  assert.equal(await read(localFile(f.project)), '기존 백엔드');
  await missing(path.join(f.project, '.git/goraebap-workflow/lock.json'));
  await missing(path.join(f.project, 'AGENTS.md'));
});

test('다른 이름의 기존 입구도 감지해 이중 온보딩을 막는다', async t => {
  const f = await fixture(t);
  const file = localFile(f.project, 'hohoco-readme/SKILL.md');
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, '기존 프로젝트 입구');
  const result = await f.call('onboard', '--source', f.source, '--prefix', 'hohoco', '--agents', 'codex');
  assert.equal(result.status, 'existing-skills');
  assert.deepEqual(result.skills, ['hohoco-readme']);
  assert.equal(await read(file), '기존 프로젝트 입구');
  await missing(localFile(f.project, 'hohoco-mode/SKILL.md'));
  await missing(path.join(f.project, '.git/goraebap-workflow/lock.json'));
});

test('설치·이름 변환·오프라인 비교·동기화가 팀 경로에서 동작한다', async t => {
  const f = await fixture(t);
  const result = await f.install('--prefix', 'acme');
  assert.equal(result.installed.length, 7);
  const entry = await read(localFile(f.project, 'acme-mode/SKILL.md'));
  assert(entry.includes('name: acme-mode'));
  assert(entry.includes('acme-backend'));
  assert(!entry.includes('../backend/SKILL.md'));
  assert(entry.includes('../acme-api/SKILL.md'));
  assert.equal(
    await read(localFile(f.project, 'acme-frontend/references/structure.md')),
    await read(path.join(f.source, 'skills/frontend/references/structure.md')),
  );
  assert(!entry.includes('disable-model-invocation'));
  await missing(localFile(f.project, 'acme-mode/agents/openai.yaml'));
  const lock = await read(path.join(f.project, '.git/goraebap-workflow/lock.json'));
  assert(!lock.includes(f.source.replaceAll('\\', '\\\\')));
  assert.deepEqual((await f.call('compare')).changed, []);
  assert.equal((await f.call('sync', '--check')).synchronized, false);
  await f.call('sync');
  assert.equal((await f.call('sync', '--check')).synchronized, true);
  await missing(path.join(f.project, 'AGENTS.md'));
  await missing(localFile(f.project, 'acme-design-system/assets'));
  assert((await read(localFile(f.project, 'acme-design-system/SKILL.md')))
    .includes('https://github.com/dev-goraebap/goraebap-workflow/blob/main/frontend/reference/README.md'));
  await missing(path.join(f.project, 'src'));
});

test('기존 프로젝트 스킬을 설치로 덮어쓰지 않는다', async t => {
  const f = await fixture(t);
  const file = localFile(f.project);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, '팀의 기존 지침');
  await assert.rejects(f.install(), /기존 스킬/);
  assert.equal(await read(file), '팀의 기존 지침');
  await missing(path.join(f.project, '.git/goraebap-workflow/lock.json'));
});

test('업데이트 미리보기는 쓰지 않고 적용은 로컬 예외와 새 원본을 함께 보존한다', async t => {
  const f = await fixture(t);
  await f.install();
  const local = localFile(f.project);
  const sourceFile = path.join(f.source, 'skills/api/SKILL.md');
  await fs.appendFile(local, '\n팀의 백엔드 예외\n');
  await fs.appendFile(sourceFile, '\n공통 API 개선\n');
  const lockBefore = await read(path.join(f.project, '.git/goraebap-workflow/lock.json'));
  const preview = await f.call('update', '--source', f.source);
  assert.equal(preview.applied, false);
  assert.equal(await read(path.join(f.project, '.git/goraebap-workflow/lock.json')), lockBefore);
  assert(!(await read(localFile(f.project, 'api/SKILL.md'))).includes('공통 API 개선'));
  assert.equal((await f.call('update', '--source', f.source, '--apply')).applied, true);
  assert((await read(local)).includes('팀의 백엔드 예외'));
  assert((await read(localFile(f.project, 'api/SKILL.md'))).includes('공통 API 개선'));
  const changed = (await f.call('compare')).changed;
  assert.deepEqual(changed.map(c => c.file), ['backend/SKILL.md']);
});

test('같은 파일의 서로 다른 위치 변경을 세 버전으로 병합한다', async t => {
  const f = await fixture(t);
  const sourceFile = path.join(f.source, 'skills/backend/example.md');
  await fs.writeFile(sourceFile, '시작\n\n가\n나\n다\n라\n마\n\n끝\n');
  await f.install();
  const local = localFile(f.project, 'backend/example.md');
  await fs.writeFile(local, (await read(local)).replace('시작', '팀 시작'));
  await fs.writeFile(sourceFile, (await read(sourceFile)).replace('끝', '공통 끝'));
  const result = await f.call('update', '--source', f.source, '--apply');
  assert.equal(result.applied, true);
  const merged = await read(local);
  assert(merged.includes('팀 시작'));
  assert(merged.includes('공통 끝'));
});

test('한 파일이라도 충돌하면 다른 파일과 lock도 적용하지 않는다', async t => {
  const f = await fixture(t);
  await f.install();
  const local = localFile(f.project);
  const upstream = path.join(f.source, 'skills/backend/SKILL.md');
  const original = await read(local);
  await fs.writeFile(local, original.replace('# 백엔드', '# 팀 백엔드'));
  await fs.writeFile(upstream, original.replace('# 백엔드', '# 새 공통 백엔드'));
  await fs.appendFile(path.join(f.source, 'skills/api/SKILL.md'), '\n새 API 규칙\n');
  const before = await read(path.join(f.project, '.git/goraebap-workflow/lock.json'));
  const result = await f.call('update', '--source', f.source, '--apply');
  assert.equal(result.applied, false);
  assert.deepEqual(result.conflicts, ['backend/SKILL.md']);
  assert.equal(await read(path.join(f.project, '.git/goraebap-workflow/lock.json')), before);
  assert(!(await read(localFile(f.project, 'api/SKILL.md'))).includes('새 API 규칙'));
  assert((await read(local)).includes('# 팀 백엔드'));
});

test('원본의 파일 삭제와 로컬 파일 수정은 충돌하고 새 로컬 파일은 유지한다', async t => {
  const f = await fixture(t);
  await f.install();
  await fs.appendFile(localFile(f.project), '\n팀 규칙\n');
  await fs.unlink(path.join(f.source, 'skills/backend/references/code-style.md'));
  await fs.appendFile(localFile(f.project, 'backend/references/code-style.md'), '\n로컬 수정\n');
  await fs.writeFile(localFile(f.project, 'backend/local.md'), '프로젝트 전용');
  assert((await f.call('update', '--source', f.source, '--apply')).conflicts.includes('backend/references/code-style.md'));
  assert.equal(await read(localFile(f.project, 'backend/local.md')), '프로젝트 전용');
});

test('동기화는 직접 고친 사본과 다른 스킬을 보호한다', async t => {
  const f = await fixture(t);
  await f.install();
  await f.call('sync');
  const mirror = path.join(f.project, '.claude/skills/backend/SKILL.md');
  await fs.appendFile(mirror, '\n사본에서 한 변경\n');
  await fs.appendFile(localFile(f.project), '\n원본의 변경\n');
  const unrelated = path.join(f.project, '.claude/skills/other/SKILL.md');
  await fs.mkdir(path.dirname(unrelated), { recursive: true });
  await fs.writeFile(unrelated, '다른 스킬');
  await assert.rejects(f.call('sync'), /직접 수정/);
  assert((await read(mirror)).includes('사본에서 한 변경'));
  assert.equal(await read(unrelated), '다른 스킬');
});

test('upstream 분류만 제안하고 분류 후 바뀐 파일은 다시 분류해야 한다', async t => {
  const f = await fixture(t);
  await f.install();
  await fs.appendFile(localFile(f.project), '\n공통 개선\n');
  await fs.appendFile(localFile(f.project, 'api/SKILL.md'), '\n회사 선택\n');
  await f.call('classify', '--file', 'backend/SKILL.md', '--kind', 'upstream', '--reason', '배치 처리 개선');
  await f.call('classify', '--file', 'api/SKILL.md', '--kind', 'project', '--reason', '팀 합의');
  const result = await f.call('propose', '--name', 'batch');
  const proposal = JSON.parse(await read(result.destination));
  assert.equal(proposal.changes.length, 1);
  assert(proposal.changes[0].proposed.includes('공통 개선'));
  await fs.appendFile(localFile(f.project), '\n추가 변경\n');
  await assert.rejects(f.call('propose', '--name', 'stale'), /classify/);
  assert.equal((await f.call('compare')).changed.find(c => c.file === 'backend/SKILL.md').kind, 'unclassified');
});

test('경로 탈출·알 수 없는 옵션·기준 변조를 거절한다', async t => {
  const f = await fixture(t);
  await assert.rejects(f.install('--prefix', '../escape'), /prefix/);
  await assert.rejects(f.install('--force'), /옵션/);
  await f.install();
  await assert.rejects(f.call('classify', '--file', 'backend/../../escape', '--kind', 'project', '--reason', 'x'), /경로/);
  const lockPath = path.join(f.project, '.git/goraebap-workflow/lock.json');
  const lock = JSON.parse(await read(lockPath));
  lock.base['backend/SKILL.md'] = '바꾼 기준';
  await fs.writeFile(lockPath, JSON.stringify(lock));
  await assert.rejects(f.call('compare'), /해시/);
});

test('symlink 또는 junction을 통해 프로젝트 밖에 쓰지 않는다', async t => {
  const f = await fixture(t);
  const outside = path.join(f.temp, 'outside');
  await fs.mkdir(outside);
  await fs.symlink(outside, path.join(f.project, '.agents'), process.platform === 'win32' ? 'junction' : 'dir');
  await assert.rejects(f.install(), /링크/);
  assert.deepEqual(await fs.readdir(outside), []);
});

test('생성 패키지는 개발·관리 스킬 모두 명시 호출만 허용하고 로컬 메모를 제외한다', async t => {
  const f = await fixture(t);
  const dist = await packagePlugins();
  for (const agent of ['claude', 'codex']) {
    const plugin = path.join(dist, agent, 'plugins/goraebap-workflow');
    assert.deepEqual((await fs.readdir(plugin)).sort(), [`.${agent}-plugin`, 'manager', 'project-source', 'package.json', 'README.md'].sort());
    const names = await fs.readdir(path.join(plugin, 'manager/skills'));
    assert.equal(names.length, 8);
    await missing(path.join(plugin, 'manager/skills/design-system/assets/workspace/Page.tsx'));
    await missing(path.join(plugin, 'project-source/skills/design-system/assets'));
    for (const scope of ['manager', 'project-source']) {
      const files = await fs.readdir(path.join(plugin, scope, 'skills'), { recursive: true });
      assert(!files.some(file => /\.(?:tsx?|css|mdx|webp|png)$/.test(file)), '프론트엔드 코드와 견본을 플러그인에 포함하지 않는다');
    }
    assert.deepEqual(names.sort(), ['api', 'architecture', 'backend', 'database', 'design-system', 'frontend', 'goraebap-mode', 'manage-workflow'].sort());
    for (const name of names) {
      assert((await read(path.join(plugin, 'manager/skills', name, 'SKILL.md'))).includes('disable-model-invocation: true'));
      assert.equal(await read(path.join(plugin, 'manager/skills', name, 'agents/openai.yaml')), 'policy:\n  allow_implicit_invocation: false\n');
    }
    assert.equal(await read(path.join(plugin, 'manager/scripts/workflow.mjs')), await read(path.join(root, 'manager/scripts/workflow.mjs')));
    // A relocated installation must work without the original repo or --source.
    const isolated = path.join(f.temp, `설치된 플러그인-${agent}`);
    await fs.cp(plugin, isolated, { recursive: true });
    const cli = path.join(isolated, 'manager/scripts/workflow.mjs');
    assert.equal(spawnSync(process.execPath, [cli, 'help'], { encoding: 'utf8' }).status, 0);
    const project = path.join(f.temp, agent);
    await fs.mkdir(project);
  assert.equal(spawnSync('git', ['init', project], { encoding: 'utf8' }).status, 0);
    const installed = spawnSync(process.execPath, [cli, 'onboard', '--project', project, '--agents', 'claude-code,codex'], { encoding: 'utf8' });
    assert.equal(installed.status, 0, installed.stderr);
    assert(!(await read(localFile(project, `${agent}-backend/SKILL.md`))).includes('disable-model-invocation'));
    assert.equal(JSON.parse(installed.stdout).status, 'installed');
    await missing(localFile(project, 'manage-workflow/SKILL.md'));
    await missing(localFile(project, `${agent}-backend/agents/openai.yaml`));
    assert.equal(await read(localFile(project, `${agent}-backend/SKILL.md`)), (await read(path.join(root, 'skills/backend/SKILL.md'))).replace('name: backend', `name: ${agent}-backend`));
    assert((await read(path.join(project, 'AGENTS.md'))).includes(`${agent}-mode/SKILL.md`));
    const sourceFile = path.join(isolated, 'project-source/skills/api/SKILL.md');
    await fs.appendFile(sourceFile, '\n새 설치본의 API 개선\n');
    const preview = spawnSync(process.execPath, [cli, 'update', '--project', project], { encoding: 'utf8' });
    assert.equal(preview.status, 0, preview.stderr);
    assert.equal(JSON.parse(preview.stdout).applied, false);
    assert(JSON.parse(preview.stdout).files.includes(`${agent}-api/SKILL.md`));
    assert(!(await read(localFile(project, `${agent}-api/SKILL.md`))).includes('새 설치본의 API 개선'));
    const applied = spawnSync(process.execPath, [cli, 'update', '--project', project, '--apply'], { encoding: 'utf8' });
    assert.equal(applied.status, 0, applied.stderr);
    assert((await read(localFile(project, `${agent}-api/SKILL.md`))).includes('새 설치본의 API 개선'));
  }
});

test('저장소 루트를 원본으로 주어도 plugin 아래 지침을 찾는다', async t => {
  const f = await fixture(t);
  const repository = path.join(f.temp, '새 저장소');
  await fs.mkdir(repository);
  await fs.rename(f.source, path.join(repository, 'plugin'));
  const installed = await f.call('install', '--source', repository, '--prefix', 'repo');
  assert.equal(installed.installed.length, 7);
  assert((await read(localFile(f.project, 'repo-frontend/SKILL.md'))).includes('name: repo-frontend'));
});
