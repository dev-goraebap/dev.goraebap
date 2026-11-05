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

test('설치·이름 변환·오프라인 비교·동기화가 팀 경로에서 동작한다', async t => {
  const f = await fixture(t);
  const result = await f.install('--prefix', 'acme');
  assert.equal(result.installed.length, 7);
  const entry = await read(localFile(f.project, 'acme-mode/SKILL.md'));
  assert(entry.includes('name: acme-mode'));
  assert(entry.includes('acme-backend'));
  assert(!entry.includes('../backend/SKILL.md'));
  assert(entry.includes('../acme-api/SKILL.md'));
  assert((await read(localFile(f.project, 'acme-frontend/references/structure.md'))).includes('pages/<페이지>/{ui,model,api}'));
  assert(!entry.includes('disable-model-invocation'));
  await missing(localFile(f.project, 'acme-mode/agents/openai.yaml'));
  const lock = await read(path.join(f.project, '.git/goraebap-workflow/lock.json'));
  assert(!lock.includes(f.source.replaceAll('\\', '\\\\')));
  assert.deepEqual((await f.call('compare')).changed, []);
  assert.equal((await f.call('sync', '--check')).synchronized, false);
  await f.call('sync');
  assert.equal((await f.call('sync', '--check')).synchronized, true);
  await missing(path.join(f.project, 'AGENTS.md'));
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
    assert.deepEqual((await fs.readdir(plugin)).sort(), [`.${agent}-plugin`, 'manager', 'package.json', 'README.md'].sort());
    const names = await fs.readdir(path.join(plugin, 'manager/skills'));
    assert.equal(names.length, 8);
    assert.deepEqual(names.sort(), ['api', 'architecture', 'backend', 'database', 'design-system', 'frontend', 'goraebap-mode', 'manage-workflow'].sort());
    for (const name of names) {
      assert((await read(path.join(plugin, 'manager/skills', name, 'SKILL.md'))).includes('disable-model-invocation: true'));
      assert.equal(await read(path.join(plugin, 'manager/skills', name, 'agents/openai.yaml')), 'policy:\n  allow_implicit_invocation: false\n');
    }
    assert.equal(await read(path.join(plugin, 'manager/scripts/workflow.mjs')), await read(path.join(root, 'manager/scripts/workflow.mjs')));
    const cli = path.join(plugin, 'manager/scripts/workflow.mjs');
    assert.equal(spawnSync(process.execPath, [cli, 'help'], { encoding: 'utf8' }).status, 0);
    const project = path.join(f.temp, agent);
    await fs.mkdir(project);
  assert.equal(spawnSync('git', ['init', project], { encoding: 'utf8' }).status, 0);
    const installed = spawnSync(process.execPath, [cli, 'install', '--project', project, '--source', f.source], { encoding: 'utf8' });
    assert.equal(installed.status, 0, installed.stderr);
    assert(!(await read(localFile(project))).includes('disable-model-invocation'));
  }
});
