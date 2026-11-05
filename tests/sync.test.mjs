import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { run } from '../manager/scripts/workflow.mjs';
import { gitDirectory, synchronize } from '../manager/templates/sync-skills.mjs';
import { hookCommand } from '../manager/scripts/setup-sync.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const text = file => fs.readFile(file, 'utf8');
const missing = file => assert.rejects(fs.access(file), { code: 'ENOENT' });
const executeHook = (command, cwd) => spawnSync(process.platform === 'win32' ? 'powershell' : 'sh', process.platform === 'win32' ? ['-NoProfile', '-Command', command] : ['-c', command], { cwd, encoding: 'utf8', windowsHide: true });
function git(project, ...args) {
  const result = spawnSync('git', ['-C', project, ...args], { encoding: 'utf8', windowsHide: true });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}
async function fixture(t) {
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'skill-sync-test-'));
  t.after(async () => {
    assert.equal(path.dirname(temp), os.tmpdir());
    assert(path.basename(temp).startsWith('skill-sync-test-'));
    await fs.rm(temp, { recursive: true, force: true });
  });
  const project = path.join(temp, '프로젝트 공백');
  await fs.mkdir(project);
  git(project, 'init');
  const source = path.join(project, '.agents/skills/team-rules');
  await fs.mkdir(source, { recursive: true });
  await fs.writeFile(path.join(source, 'SKILL.md'), '---\nname: team-rules\ndescription: 팀 규칙\n---\n팀의 원본\n');
  const call = (command, ...args) => run([command, '--project', project, ...args]);
  return { project, source, temp, call };
}

test('독립 동기화 설정은 개인 관리 정보 없이 팀 스킬·이미지와 세 에이전트를 지원한다', async t => {
  const f = await fixture(t);
  const externalLock = '{"externalTool":"원본 설치 기록"}\n';
  await fs.writeFile(path.join(f.project, 'skills-lock.json'), externalLock);
  const image = Buffer.from([0, 255, 128, 10, 13, 1]);
  await fs.writeFile(path.join(f.source, 'image.png'), image);
  await f.call('setup-sync');
  await missing(path.join(f.project, '.workflow'));
  await missing(path.join(await gitDirectory(f.project), 'goraebap-workflow'));
  const script = path.join(f.project, 'scripts/sync-skills.mjs');
  assert(!(await text(script)).includes('goraebap'));
  const result = spawnSync(process.execPath, [script], { cwd: os.tmpdir(), encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  assert.equal(await text(path.join(f.project, 'skills-lock.json')), externalLock);
  assert.deepEqual(await fs.readFile(path.join(f.project, '.claude/skills/team-rules/image.png')), image);
  assert.deepEqual(await fs.readFile(path.join(f.project, '.grok/skills/team-rules/image.png')), image);
  await missing(path.join(f.project, '.codex/skills'));
  for (const file of ['.claude/settings.json', '.codex/hooks.json', '.grok/hooks/skill-sync.json']) assert(!(await text(path.join(f.project, file))).includes('goraebap'));
  assert.equal(git(f.project, 'check-ignore', '.claude/skills/team-rules/SKILL.md'), '.claude/skills/team-rules/SKILL.md');
  assert.equal(git(f.project, 'check-ignore', '.grok/skills/team-rules/SKILL.md'), '.grok/skills/team-rules/SKILL.md');
  git(f.project, 'add', '.');
  const tracked = git(f.project, 'ls-files').split('\n');
  assert(tracked.includes('.agents/skills/team-rules/SKILL.md'));
  assert(tracked.includes('.claude/settings.json'));
  assert(!tracked.some(file => file.startsWith('.claude/skills/') || file.startsWith('.grok/skills/') || file.startsWith('.workflow/')));
});

test('기존 훅·권한·ignore를 보존하고 반복 설정은 중복 훅을 만들지 않는다', async t => {
  const f = await fixture(t);
  await fs.mkdir(path.join(f.project, '.claude'));
  const existing = { permissions: { allow: ['Read'] }, hooks: { SessionStart: [{ matcher: 'startup', hooks: [{ type: 'command', command: 'echo existing' }] }], Stop: [{ hooks: [{ type: 'command', command: 'echo stop' }] }] } };
  await fs.writeFile(path.join(f.project, '.claude/settings.json'), JSON.stringify(existing));
  await fs.writeFile(path.join(f.project, '.gitignore'), 'node_modules/\n');
  await f.call('setup-sync');
  const before = await text(path.join(f.project, '.claude/settings.json'));
  const next = await f.call('setup-sync');
  assert.deepEqual(next.files, []);
  assert.equal(await text(path.join(f.project, '.claude/settings.json')), before);
  const parsed = JSON.parse(before);
  assert.deepEqual(parsed.permissions, existing.permissions);
  assert.deepEqual(parsed.hooks.Stop, existing.hooks.Stop);
  assert.deepEqual(parsed.hooks.SessionStart[0], existing.hooks.SessionStart[0]);
  assert.equal(parsed.hooks.SessionStart.length, 2);
  assert((await text(path.join(f.project, '.gitignore'))).startsWith('node_modules/\n'));
});

test('시작 훅은 하위 작업 폴더에서도 프로젝트 루트를 찾아 실행한다', async t => {
  const f = await fixture(t);
  await f.call('setup-sync');
  const cwd = path.join(f.project, 'src/deep');
  await fs.mkdir(cwd, { recursive: true });
  for (const agent of ['claude-code', 'codex', 'grok']) {
    const result = executeHook(hookCommand(agent), cwd);
    assert.equal(result.status, 0, result.stderr);
    if (agent === 'claude-code') assert.deepEqual(JSON.parse(result.stdout), { hookSpecificOutput: { hookEventName: 'SessionStart', reloadSkills: true } });
    else assert.equal(result.stdout, '');
  }
  if (process.platform === 'win32') {
    const result = spawnSync('powershell', ['-NoProfile', '-Command', hookCommand('codex')], { cwd, encoding: 'utf8', windowsHide: true });
    assert.equal(result.status, 0, result.stderr);
  }
  assert.equal((await f.call('sync', '--check')).synchronized, true);
});

test('새 clone은 플러그인·개인 기준 없이 훅 명령으로 사본을 만든다', async t => {
  const f = await fixture(t);
  await f.call('setup-sync');
  git(f.project, 'add', '.');
  git(f.project, '-c', 'user.name=Test', '-c', 'user.email=test@example.test', 'commit', '-m', 'fixture');
  const clone = path.join(f.temp, '새 clone');
  const result = spawnSync('git', ['clone', f.project, clone], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  await missing(path.join(clone, '.claude/skills'));
  const hook = JSON.parse(await text(path.join(clone, '.claude/settings.json'))).hooks.SessionStart[0].hooks[0].command;
  const started = executeHook(hook, clone);
  assert.equal(started.status, 0, started.stderr);
  assert.equal(await text(path.join(clone, '.claude/skills/team-rules/SKILL.md')), await text(path.join(clone, '.agents/skills/team-rules/SKILL.md')));
  await missing(path.join(await gitDirectory(clone), 'goraebap-workflow'));
  await assert.rejects(run(['compare', '--project', clone]), /로컬 관리 기준/);
});

test('다른 사본의 충돌을 발견하면 선택한 모든 사본에 변경을 적용하지 않는다', async t => {
  const f = await fixture(t);
  await f.call('setup-sync');
  await f.call('sync');
  const original = await text(path.join(f.project, '.claude/skills/team-rules/SKILL.md'));
  await fs.appendFile(path.join(f.source, 'SKILL.md'), '새 원본\n');
  await fs.appendFile(path.join(f.project, '.grok/skills/team-rules/SKILL.md'), '직접 수정\n');
  await assert.rejects(f.call('sync'), /직접 수정/);
  assert.equal(await text(path.join(f.project, '.claude/skills/team-rules/SKILL.md')), original);
});

test('삭제된 원본의 소유 사본만 지우고 모르는 파일은 보존한다', async t => {
  const f = await fixture(t);
  await f.call('setup-sync');
  await fs.writeFile(path.join(f.source, 'obsolete.md'), '옛 파일');
  await f.call('sync');
  await fs.writeFile(path.join(f.project, '.grok/skills/team-rules/local.md'), '사용자 파일');
  await fs.unlink(path.join(f.source, 'obsolete.md'));
  await f.call('sync');
  await missing(path.join(f.project, '.grok/skills/team-rules/obsolete.md'));
  assert.equal(await text(path.join(f.project, '.grok/skills/team-rules/local.md')), '사용자 파일');
  await fs.rename(path.join(f.project, '.agents/skills'), path.join(f.project, '.agents/skills-moved'));
  await assert.rejects(f.call('sync'), /원본이 없습니다/);
  assert((await text(path.join(f.project, '.claude/skills/team-rules/SKILL.md'))).includes('팀의 원본'));
});

test('기존 동기화 스크립트·추적 중인 사본·잘못된 훅 설정은 설정 전에 거절한다', async t => {
  const f = await fixture(t);
  await fs.mkdir(path.join(f.project, 'scripts'));
  const script = path.join(f.project, 'scripts/sync-skills.mjs');
  await fs.writeFile(script, '기존 도구');
  await assert.rejects(f.call('setup-sync'), /기존 scripts/);
  assert.equal(await text(script), '기존 도구');
  await missing(path.join(f.project, '.claude/settings.json'));
  await fs.unlink(script);
  await fs.mkdir(path.join(f.project, '.grok/skills/old'), { recursive: true });
  await fs.writeFile(path.join(f.project, '.grok/skills/old/SKILL.md'), '기존 추적 파일');
  git(f.project, 'add', '.grok');
  await assert.rejects(f.call('setup-sync'), /추적하는 파일/);
  await missing(script);
  await missing(path.join(f.project, '.claude/settings.json'));
});

test('Git worktree의 관리·사본 상태는 원본 checkout과 분리된다', async t => {
  const f = await fixture(t);
  await f.call('setup-sync');
  git(f.project, 'add', '.');
  git(f.project, '-c', 'user.name=Test', '-c', 'user.email=test@example.test', 'commit', '-m', 'fixture');
  const worktree = path.join(f.temp, '작업 트리');
  git(f.project, 'worktree', 'add', '-b', 'test-worktree', worktree);
  assert((await fs.stat(path.join(worktree, '.git'))).isFile());
  const first = await gitDirectory(f.project);
  const second = await gitDirectory(worktree);
  assert.notEqual(first, second);
  await synchronize(worktree, { agents: ['grok'] });
  await fs.access(path.join(second, 'skill-sync/grok.json'));
  await missing(path.join(first, 'skill-sync/grok.json'));
  await run(['install', '--project', worktree, '--source', root]);
  await fs.access(path.join(second, 'goraebap-workflow/lock.json'));
  await missing(path.join(first, 'goraebap-workflow/lock.json'));
});

test('선택한 에이전트만 준비한 프로젝트에서도 기본 동기화 명령이 동작한다', async t => {
  const f = await fixture(t);
  await f.call('setup-sync', '--agents', 'claude-code');
  const result = spawnSync(process.execPath, [path.join(f.project, 'scripts/sync-skills.mjs')], { cwd: f.project, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  await fs.access(path.join(f.project, '.claude/skills/team-rules/SKILL.md'));
  await missing(path.join(f.project, '.grok'));
  assert.equal((await f.call('sync', '--check')).synchronized, true);
});

test('새 관리자가 알고 있는 원본으로 adopt하면 프로젝트를 덮어쓰지 않는다', async t => {
  const f = await fixture(t);
  await f.call('install', '--source', root);
  const backend = path.join(f.project, '.agents/skills/backend/SKILL.md');
  await fs.appendFile(backend, '\n프로젝트의 예외\n');
  const gitDir = await gitDirectory(f.project);
  const metadata = path.join(gitDir, 'goraebap-workflow');
  await fs.rename(metadata, path.join(gitDir, 'saved-local-metadata'));
  await assert.rejects(f.call('adopt'), /--source/);
  const adopted = await f.call('adopt', '--source', root);
  assert(adopted.comparison.changed.some(change => change.file === 'backend/SKILL.md'));
  assert((await text(backend)).endsWith('프로젝트의 예외\n'));
  const entry = await text(path.join(f.project, '.agents/skills/development/SKILL.md'));
  assert(!entry.includes('goraebap'));
});
