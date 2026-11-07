#!/usr/bin/env node
// Project skill synchronization. Source: .agents/skills. Generated copies are never edited here.
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const AGENTS = Object.freeze({ 'claude-code': '.claude/skills', grok: '.grok/skills', codex: null });
const hash = value => createHash('sha256').update(value).digest('hex');
const json = value => `${JSON.stringify(value, null, 2)}\n`;

export async function exists(file) {
  try { await fs.lstat(file); return true; }
  catch (error) { if (error.code === 'ENOENT') return false; throw error; }
}

export async function safe(root, relative) {
  if (typeof relative !== 'string' || path.isAbsolute(relative) || relative.includes('\\') || relative.split('/').some(p => !p || p === '.' || p === '..')) throw new Error(`잘못된 상대 경로: ${relative}`);
  const base = await fs.realpath(root);
  let cursor = base;
  const parts = relative.split('/');
  for (const [index, part] of parts.entries()) {
    cursor = path.join(cursor, part);
    if (!await exists(cursor)) continue;
    const stat = await fs.lstat(cursor);
    if (stat.isSymbolicLink()) throw new Error(`링크 경로는 지원하지 않습니다: ${relative}`);
    if (index < parts.length - 1 && !stat.isDirectory()) throw new Error(`상위 경로가 폴더가 아닙니다: ${relative}`);
  }
  return cursor;
}

export async function gitDirectory(project) {
  const root = await fs.realpath(project);
  const execute = args => {
    const result = spawnSync('git', ['-C', root, ...args], { encoding: 'utf8', windowsHide: true });
    if (result.status !== 0) throw new Error('프로젝트 Git 저장소를 먼저 준비하세요.');
    return result.stdout.trim();
  };
  const top = await fs.realpath(execute(['rev-parse', '--show-toplevel']));
  if (top !== root) throw new Error('--project에는 Git 저장소 루트를 지정하세요.');
  // Git resolves linked-worktree .git files; never append paths to a literal .git.
  return fs.realpath(execute(['rev-parse', '--absolute-git-dir']));
}

async function read(file) {
  try { return await fs.readFile(file); }
  catch (error) { if (error.code === 'ENOENT') return undefined; throw error; }
}

async function scan(root, relative) {
  const output = {};
  for (const entry of await fs.readdir(await safe(root, relative), { withFileTypes: true })) {
    const child = `${relative}/${entry.name}`;
    if (entry.isDirectory()) Object.assign(output, await scan(root, child));
    else if (entry.isFile()) output[child] = await fs.readFile(await safe(root, child));
    else throw new Error(`일반 파일과 폴더만 지원합니다: ${child}`);
  }
  return output;
}

async function canonical(project) {
  const directory = await safe(project, '.agents/skills');
  if (!await exists(directory)) throw new Error('.agents/skills 원본이 없습니다. 사본을 삭제하지 않았습니다.');
  const files = {};
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) throw new Error(`원본 스킬은 실제 폴더로 관리하세요: ${entry.name}`);
    if (!entry.isDirectory()) continue;
    const relative = `.agents/skills/${entry.name}`;
    if (!await exists(await safe(project, `${relative}/SKILL.md`))) continue;
    for (const [file, data] of Object.entries(await scan(project, relative))) files[file.slice('.agents/skills/'.length)] = data;
  }
  return files;
}

export async function synchronize(project, { agents, check = false } = {}) {
  const git = await gitDirectory(project);
  const isIgnored = target => spawnSync('git', ['-C', project, 'check-ignore', '--quiet', '--no-index', `${target}/__skill_sync_probe__`], { windowsHide: true }).status === 0;
  // The shared ignore rules define available copy targets; no personal plugin config is needed.
  if (agents === undefined) agents = Object.keys(AGENTS).filter(agent => !AGENTS[agent] || isIgnored(AGENTS[agent]));
  for (const agent of agents) if (!Object.hasOwn(AGENTS, agent)) throw new Error(`지원하는 agent: ${Object.keys(AGENTS).join(', ')}`);
  const source = await canonical(project);
  const held = [];
  const plans = [];
  try {
    // Every target has its own clone-local lock, including concurrent start hooks.
    for (const agent of [...new Set(agents)].sort()) {
      const target = AGENTS[agent];
      if (!target) continue;
      if (!isIgnored(target)) throw new Error(`${target}를 먼저 gitignore로 제외하세요. 동기화 설정을 준비한 뒤 실행하세요.`);
      const tracked = spawnSync('git', ['-C', project, 'ls-files', '-z', '--', target], { encoding: 'utf8', windowsHide: true });
      if (tracked.status !== 0 || tracked.stdout) throw new Error(`${target}의 Git 추적 상태를 먼저 정리하세요. 추적 중인 사본은 자동 변경하지 않습니다.`);
      const statePath = await safe(git, `skill-sync/${agent}.json`);
      if (!check) {
        const mutex = await safe(git, `skill-sync/${agent}.lock`);
        await fs.mkdir(path.dirname(mutex), { recursive: true });
        let handle;
        try { handle = await fs.open(mutex, 'wx'); }
        catch (error) { if (error.code === 'EEXIST') throw new Error(`${agent} 동기화가 이미 실행 중입니다. 중단된 작업의 lock은 실행 상태 확인 후 정리하세요.`); throw error; }
        held.push({ mutex, handle });
        await handle.writeFile(String(process.pid));
      }
      const raw = await read(statePath);
      const previous = raw ? JSON.parse(raw.toString('utf8')) : { schemaVersion: 1, files: {} };
      if (previous.schemaVersion !== 1 || !previous.files || typeof previous.files !== 'object' || Array.isArray(previous.files)) throw new Error('지원하지 않는 동기화 상태입니다.');
      const desired = Object.fromEntries(Object.entries(source).map(([file, data]) => [`${target}/${file}`, data]));
      const changes = [];
      for (const file of new Set([...Object.keys(desired), ...Object.keys(previous.files)])) {
        if (!file.startsWith(`${target}/`) || typeof previous.files[file] !== 'string' && Object.hasOwn(previous.files, file)) throw new Error(`관리 범위 밖의 사본: ${file}`);
        const absolute = await safe(project, file);
        const current = await read(absolute);
        const wanted = desired[file];
        if (current?.equals(wanted ?? Buffer.alloc(0)) && wanted !== undefined || current === undefined && wanted === undefined) continue;
        if (current !== undefined && hash(current) !== previous.files[file]) throw new Error(`사본이 직접 수정됐거나 소유자가 다릅니다. .agents/skills 원본으로 먼저 회수하세요: ${file}`);
        changes.push({ absolute, file, data: wanted });
      }
      plans.push({ agent, statePath, desired, changes });
    }
    // Conflict and path preflight for all selected agents finishes before copying anything.
    if (!check) {
      for (const plan of plans) {
        for (const change of plan.changes) {
          if (change.data === undefined) await fs.unlink(change.absolute);
          else {
            await fs.mkdir(path.dirname(change.absolute), { recursive: true });
            await fs.writeFile(change.absolute, change.data);
          }
        }
        const state = { schemaVersion: 1, files: Object.fromEntries(Object.entries(plan.desired).map(([file, data]) => [file, hash(data)])) };
        const pending = `${plan.statePath}.tmp`;
        await safe(git, `skill-sync/${plan.agent}.json.tmp`);
        await fs.writeFile(pending, json(state));
        await fs.rename(pending, plan.statePath);
      }
    }
    const changed = plans.flatMap(plan => plan.changes.map(change => change.file));
    return { check, synchronized: !check || changed.length === 0, agents, files: changed };
  } finally {
    for (const { mutex, handle } of held.reverse()) { await handle.close(); await fs.unlink(mutex); }
  }
}

export async function run(args = process.argv.slice(2)) {
  const options = { check: false };
  let hook = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--check') options.check = true;
    else if (args[i] === '--hook') hook = true;
    else if (args[i] === '--agent') {
      const value = args[++i];
      if (!value) throw new Error('--agent 값이 필요합니다.');
      options.agents = value.split(',');
    } else throw new Error(`알 수 없는 옵션: ${args[i]}`);
  }
  const project = fileURLToPath(new URL('../', import.meta.url));
  const result = await synchronize(project, options);
  if (!hook) process.stdout.write(json(result));
  else if (options.agents?.includes('claude-code')) process.stdout.write(json({ hookSpecificOutput: { hookEventName: 'SessionStart', reloadSkills: true } }));
  if (options.check && !result.synchronized) process.exitCode = 1;
  return result;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run().catch(error => { process.stderr.write(`${error.message}\n`); process.exitCode = 1; });
}
