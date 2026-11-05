import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { AGENTS, exists, gitDirectory, safe } from '../templates/sync-skills.mjs';

const hash = value => createHash('sha256').update(value).digest('hex');
const json = value => `${JSON.stringify(value, null, 2)}\n`;
const SCRIPT = 'scripts/sync-skills.mjs';
const HOOK_FILES = { 'claude-code': '.claude/settings.json', codex: '.codex/hooks.json', grok: '.grok/hooks/skill-sync.json' };

export function hookCommand(agent) {
  if (!Object.hasOwn(AGENTS, agent)) throw new Error('알 수 없는 agent입니다.');
  return `node -e "const c=require('node:child_process');const p=require('node:path');const u=require('node:url');const r=c.execFileSync('git',['rev-parse','--show-toplevel'],{encoding:'utf8'}).trim();import(u.pathToFileURL(p.join(r,'${SCRIPT}')).href).then(m=>m.run(['--agent','${agent}','--hook'])).catch(e=>{console.error(e.message);process.exitCode=1})"`;
}

async function content(root, relative) {
  const file = await safe(root, relative);
  return await exists(file) ? fs.readFile(file, 'utf8') : undefined;
}

export async function setupPlan(project, agents = Object.keys(AGENTS)) {
  if (!agents.length || new Set(agents).size !== agents.length || agents.some(agent => !Object.hasOwn(AGENTS, agent))) throw new Error(`--agents는 ${Object.keys(AGENTS).join(',')} 중에서 지정하세요.`);
  const git = await gitDirectory(project);
  const template = await fs.readFile(new URL('../templates/sync-skills.mjs', import.meta.url), 'utf8');
  const existing = await content(project, SCRIPT);
  const state = JSON.parse(await content(git, 'skill-sync/setup.json') ?? '{}');
  const normalized = text => text.replace(/\r\n/g, '\n');
  if (existing !== undefined && normalized(existing) !== normalized(template) && hash(normalized(existing)) !== state.scriptHash) throw new Error('기존 scripts/sync-skills.mjs를 덮어쓰지 않습니다. 기존 동기화 방식을 먼저 통합하세요.');
  const changes = [];
  if (existing === undefined || normalized(existing) !== normalized(template)) changes.push({ file: SCRIPT, content: template });
  const initialIgnore = await content(project, '.gitignore') ?? '';
  let ignore = initialIgnore;
  for (const agent of agents) {
    const target = AGENTS[agent];
    if (target) {
      const tracked = spawnSync('git', ['-C', project, 'ls-files', '-z', '--', target], { encoding: 'utf8', windowsHide: true });
      if (tracked.status !== 0) throw new Error('Git 추적 상태를 확인하지 못했습니다.');
      if (tracked.stdout) throw new Error(`${target}에 Git이 추적하는 파일이 있습니다. 사본을 원본과 대조하고 추적 해제를 먼저 검토하세요.`);
      const rule = `/${target}/`;
      if (!ignore.split(/\r?\n/).includes(rule)) ignore += `${ignore && !ignore.endsWith('\n') ? '\n' : ''}${rule}\n`;
    }
    const hookFile = HOOK_FILES[agent];
    const original = await content(project, hookFile);
    const config = original ? JSON.parse(original) : {};
    if (!config || typeof config !== 'object' || Array.isArray(config)) throw new Error(`훅 설정은 JSON 객체여야 합니다: ${hookFile}`);
    if (config.hooks === undefined) config.hooks = {};
    if (!config.hooks || typeof config.hooks !== 'object' || Array.isArray(config.hooks)) throw new Error(`hooks는 객체여야 합니다: ${hookFile}`);
    const start = config.hooks.SessionStart ?? [];
    if (!Array.isArray(start)) throw new Error(`SessionStart는 배열이어야 합니다: ${hookFile}`);
    const command = hookCommand(agent);
    const installed = start.some(group => group?.matcher === undefined && group?.hooks?.some(hook => hook.type === 'command' && hook.command === command));
    if (!installed) {
      config.hooks.SessionStart = [...start, { hooks: [{ type: 'command', command, ...(agent === 'codex' ? { commandWindows: command } : {}), timeout: 30 }] }];
      changes.push({ file: hookFile, content: json(config) });
    }
  }
  if (ignore !== initialIgnore) changes.push({ file: '.gitignore', content: ignore });
  return { git, changes, state: { scriptHash: hash(normalized(template)), agents: [...new Set([...(state.agents ?? []), ...agents])] } };
}

export async function applySetup(project, plan) {
  for (const change of plan.changes) await safe(project, change.file);
  const statePath = await safe(plan.git, 'skill-sync/setup.json');
  for (const change of plan.changes) {
    const absolute = await safe(project, change.file);
    await fs.mkdir(path.dirname(absolute), { recursive: true });
    await fs.writeFile(absolute, change.content);
  }
  await fs.mkdir(path.dirname(statePath), { recursive: true });
  await fs.writeFile(statePath, json(plan.state));
  return { files: plan.changes.map(change => change.file), agents: plan.state.agents, next: '프로젝트 훅을 검토·신뢰한 뒤 시작하세요. 플러그인 없이 node scripts/sync-skills.mjs로도 실행할 수 있습니다.' };
}
