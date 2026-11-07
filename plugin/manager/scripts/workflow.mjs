#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { gitDirectory, synchronize, AGENTS } from '../templates/sync-skills.mjs';
import { setupPlan, applySetup } from './setup-sync.mjs';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const LOCK = 'goraebap-workflow/lock.json';
const DECISIONS = 'goraebap-workflow/decisions.json';
const digest = value => createHash('sha256').update(value).digest('hex');
const json = value => `${JSON.stringify(value, null, 2)}\n`;
const normalize = value => value.replace(/\r\n/g, '\n');
const slug = value => typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
const exists = async file => { try { await fs.lstat(file); return true; } catch (e) { if (e.code === 'ENOENT') return false; throw e; } };

async function safe(root, relative) {
  if (typeof relative !== 'string' || relative.includes('\\') || relative.split('/').some(p => !p || p === '.' || p === '..') || path.isAbsolute(relative)) {
    throw new Error(`잘못된 상대 경로: ${relative}`);
  }
  const resolvedRoot = await fs.realpath(root);
  const target = path.resolve(resolvedRoot, relative);
  const rel = path.relative(resolvedRoot, target);
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) throw new Error(`프로젝트 밖의 경로: ${relative}`);
  let cursor = resolvedRoot;
  const parts = relative.split('/');
  for (const [index, part] of parts.entries()) {
    cursor = path.join(cursor, part);
    if (await exists(cursor)) {
      const stat = await fs.lstat(cursor);
      if (stat.isSymbolicLink()) throw new Error(`링크 경로는 지원하지 않습니다: ${relative}`);
      if (index < parts.length - 1 && !stat.isDirectory()) throw new Error(`상위 경로가 폴더가 아닙니다: ${relative}`);
    }
  }
  return target;
}

async function read(root, relative) {
  const target = await safe(root, relative);
  try { return normalize(await fs.readFile(target, 'utf8')); }
  catch (e) { if (e.code === 'ENOENT') return undefined; throw e; }
}

async function write(root, relative, content) {
  const target = await safe(root, relative);
  if (content === undefined) { if (await exists(target)) await fs.unlink(target); return; }
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, content);
}

async function readJson(root, relative, fallback) {
  const content = await read(root, relative);
  if (content === undefined) {
    if (fallback !== undefined) return fallback;
    throw new Error(`로컬 관리 기준 ${relative}가 없습니다. install 또는 알려진 원본을 지정한 adopt가 필요합니다.`);
  }
  return JSON.parse(content);
}

async function readMeta(project, relative, fallback) {
  return readJson(await gitDirectory(project), relative, fallback);
}

async function writeMeta(project, relative, value) {
  return write(await gitDirectory(project), relative, json(value));
}

function selectedAgents(options) {
  return options.agents === undefined ? Object.keys(AGENTS) : options.agents.split(',');
}

async function files(root, relative) {
  const result = {};
  const directory = await safe(root, relative);
  if (!await exists(directory)) return result;
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const child = `${relative}/${entry.name}`;
    if (entry.isDirectory()) Object.assign(result, await files(root, child));
    else if (entry.isFile()) result[child] = await read(root, child);
    else throw new Error(`일반 파일과 폴더만 지원합니다: ${child}`);
  }
  return result;
}

async function sourceDirectory(source) {
  if (await exists(await safe(source, 'skills'))) return source;
  const nested = await safe(source, 'plugin');
  if (await exists(nested) && await exists(await safe(nested, 'skills'))) return nested;
  throw new Error('개발 지침의 skills 폴더를 찾을 수 없습니다. 저장소 또는 plugin 경로를 확인하세요.');
}

async function sourceBundle(source, mapping) {
  source = await sourceDirectory(source);
  const pkg = await readJson(source, 'package.json');
  if (pkg.name !== 'goraebap-workflow') throw new Error('goraebap-workflow 원본을 지정하세요.');
  const available = (await fs.readdir(await safe(source, 'skills'), { withFileTypes: true }))
    .filter(e => e.isDirectory()).map(e => e.name).sort();
  if (!mapping) mapping = Object.fromEntries(available.map(name => [name, name === 'goraebap-mode' ? 'development' : name]));
  if (!Object.keys(mapping).length || Object.values(mapping).some(name => !slug(name)) || new Set(Object.values(mapping)).size !== Object.keys(mapping).length) {
    throw new Error('스킬 이름 대응 관계가 잘못됐습니다.');
  }
  for (const name of Object.keys(mapping)) {
    if (!slug(name) || !available.includes(name)) throw new Error(`원본 스킬이 없습니다: ${name}`);
    if (await read(source, `skills/${name}/SKILL.md`) === undefined) throw new Error(`SKILL.md가 없습니다: ${name}`);
  }
  const output = {};
  for (const [name, target] of Object.entries(mapping)) {
    for (const [file, raw] of Object.entries(await files(source, `skills/${name}`))) {
      // Rename skill metadata and cross-skill links, never API paths or code identifiers.
      const content = raw
        .replace(/^(name: )([a-z0-9-]+)$/m, (match, label, skill) => `${label}${mapping[skill] ?? skill}`)
        .replace(/\.\.\/([a-z0-9-]+)\//g, (match, skill) => `../${mapping[skill] ?? skill}/`);
      output[`${target}/${file.slice(`skills/${name}/`.length)}`] = content;
    }
  }
  return { identity: pkg.name, version: pkg.version, mapping, files: output, digest: digest(json(output)) };
}

async function defaultSource() {
  const bundled = await safe(ROOT, 'project-source');
  return await exists(bundled) ? bundled : ROOT;
}

async function projectPrefix(project, options) {
  if (options.prefix !== undefined) {
    if (!slug(options.prefix)) throw new Error('prefix는 소문자·숫자·하이픈으로 지정하세요.');
    return options.prefix;
  }
  const packageText = await read(project, 'package.json');
  const name = packageText ? JSON.parse(packageText).name : undefined;
  const candidate = (name?.split('/').pop() || path.basename(project)).toLowerCase().replace(/[ ._]+/g, '-');
  return slug(candidate) ? candidate : undefined;
}

async function onboard(project, source, options) {
  const git = await gitDirectory(project);
  const guidance = await read(project, 'AGENTS.md');
  if (await exists(await safe(git, LOCK))) {
    const lock = await readMeta(project, LOCK);
    validateLock(lock);
    return { status: 'managed', project, comparison: await compare(project, lock), guidance: guidance === undefined ? 'missing' : 'existing', next: '설치된 프로젝트입니다. 상태와 관리 작업을 안내하세요. 요청 없이 업데이트·재설치·기준 재등록을 하지 마세요.' };
  }
  await sourceBundle(source);
  const prefix = await projectPrefix(project, options);
  const skillRoot = await safe(project, '.agents/skills');
  const existing = [];
  if (await exists(skillRoot)) for (const entry of await fs.readdir(skillRoot, { withFileTypes: true })) {
    if (entry.isDirectory() && await read(project, `.agents/skills/${entry.name}/SKILL.md`) !== undefined) existing.push(entry.name);
  }
  if (existing.length) return { status: 'existing-skills', project, skills: existing.sort(), prefix, next: '기존 지침을 먼저 읽으세요. 다른 이름의 프로젝트 입구도 확인해 이중 설치하지 마세요. 공통 전환 요청이면 전용 규칙을 분리한 뒤 install --prefix로 설치합니다. 동기화만 필요하면 setup-sync를 사용하고 과거 기준은 추정하지 마세요.' };
  if (!prefix) return { status: 'needs-prefix', project, next: '프로젝트 이름·약어를 대화와 설정에서 확인해 --prefix로 전달하세요. 확인할 수 없을 때만 한 번 질문하세요. 아직 파일을 변경하지 않았습니다.' };
  const entry = `${prefix}-mode`;
  const agents = options.agents ? selectedAgents(options) : [];
  if (!options.agents) {
    for (const [agent, file] of Object.entries({ 'claude-code': '.claude/settings.json', codex: '.codex/hooks.json', grok: '.grok/hooks/skill-sync.json' })) {
      if (await exists(await safe(project, file))) agents.push(agent);
    }
  }
  if (!agents.length) return { status: 'needs-agents', project, next: '대화·프로젝트 설정에서 사용 에이전트를 확인하세요. 확인할 수 없을 때만 한 번 짧게 질문하고 --agents로 다시 실행하세요. 아직 파일을 변경하지 않았습니다.' };
  // Validate AGENTS.md and all install/setup targets before the first mutation.
  await safe(project, 'AGENTS.md');
  const result = await install(project, source, { ...options, prefix, agents: agents.join(',') });
  const content = `개발 작업은 .agents/skills/${entry}/SKILL.md에서 시작한다.\n스킬 원본은 .agents/skills다. 에이전트별 skills 폴더는 생성 사본이다.\n사본은 직접 수정하지 않고 node scripts/sync-skills.mjs로 동기화한다.\n`;
  if (guidance === undefined) await write(project, 'AGENTS.md', `# 프로젝트 작업 지침\n\n${content}`);
  return { ...result, status: 'installed', project, agents, guidance: guidance === undefined ? { created: 'AGENTS.md' } : { existing: 'AGENTS.md', suggested: content, next: '기존 규칙과 입구를 읽고 중복·충돌 없이 통합하세요. 개인 플러그인 이름과 로컬 경로는 넣지 마세요.' }, next: 'AGENTS.md 연결을 마친 뒤 독립 sync와 --check를 실행하세요. 훅 설정 생성과 실제 세션의 신뢰·실행 여부를 구분해 보고하세요.' };
}

function validateLock(lock) {
  if (lock.schemaVersion !== 1 || lock.source?.identity !== 'goraebap-workflow' || !lock.mapping || !lock.base) throw new Error('지원하지 않는 lock 형식입니다.');
  for (const [from, target] of Object.entries(lock.mapping)) if (!slug(from) || !slug(target)) throw new Error('잘못된 스킬 이름입니다.');
  if (new Set(Object.values(lock.mapping)).size !== Object.keys(lock.mapping).length) throw new Error('중복 스킬 이름입니다.');
  for (const [file, value] of Object.entries(lock.base)) {
    if (!Object.values(lock.mapping).includes(file.split('/')[0]) || typeof value !== 'string') throw new Error('잘못된 기준 파일입니다.');
  }
  if (digest(json(lock.base)) !== lock.source.digest) throw new Error('기준 스냅샷의 해시가 다릅니다. lock을 직접 고치지 마세요.');
}

async function localFiles(project, lock) {
  const output = {};
  for (const target of Object.values(lock.mapping)) {
    const found = await files(project, `.agents/skills/${target}`);
    for (const [file, content] of Object.entries(found)) output[file.slice('.agents/skills/'.length)] = content;
  }
  return output;
}

async function install(project, source, options) {
  const git = await gitDirectory(project);
  if (await exists(await safe(git, LOCK))) throw new Error('이미 설치된 프로젝트입니다. compare 또는 update를 쓰세요.');
  const initial = await sourceBundle(source);
  const prefix = options.prefix;
  if (prefix !== undefined && !slug(prefix)) throw new Error('prefix는 소문자·숫자·하이픈으로 지정하세요.');
  const mapping = prefix ? Object.fromEntries(Object.keys(initial.mapping).map(name => [name, `${prefix}-${name.replace(/^goraebap-/, '')}`])) : initial.mapping;
  const bundle = await sourceBundle(source, mapping);
  for (const target of Object.values(mapping)) {
    if (await exists(await safe(project, `.agents/skills/${target}`))) throw new Error(`기존 스킬을 덮어쓰지 않습니다: ${target}`);
  }
  const plan = await setupPlan(project, selectedAgents(options));
  const lock = { schemaVersion: 1, source: { identity: bundle.identity, version: bundle.version, digest: bundle.digest }, mapping, base: bundle.files };
  for (const [file, content] of Object.entries(bundle.files)) await write(project, `.agents/skills/${file}`, content);
  await applySetup(project, plan);
  await writeMeta(project, LOCK, lock);
  return { installed: Object.values(mapping), source: lock.source, setup: plan.changes.map(c => c.file), metadata: await safe(git, LOCK), next: '프로젝트 AGENTS.md에는 프로젝트 입구와 원본/사본 정책만 연결하세요. 훅 신뢰 승인은 각 사용자가 진행합니다.' };
}

async function adopt(project, source, options) {
  const git = await gitDirectory(project);
  if (await exists(await safe(git, LOCK))) throw new Error('이미 관리 기준이 있습니다.');
  if (!options.source) throw new Error('adopt에는 채택했던 원본 체크아웃을 --source로 명시하세요. 현재 파일을 원본으로 추정하지 않습니다.');
  if (options.prefix !== undefined && !slug(options.prefix)) throw new Error('prefix가 잘못됐습니다.');
  const initial = await sourceBundle(source);
  const mapping = options.prefix ? Object.fromEntries(Object.keys(initial.mapping).map(name => [name, `${options.prefix}-${name.replace(/^goraebap-/, '')}`])) : initial.mapping;
  const bundle = await sourceBundle(source, mapping);
  for (const name of Object.values(mapping)) if (await read(project, `.agents/skills/${name}/SKILL.md`) === undefined) throw new Error(`등록할 프로젝트 스킬이 없습니다: ${name}`);
  const lock = { schemaVersion: 1, source: { identity: bundle.identity, version: bundle.version, digest: bundle.digest }, mapping, base: bundle.files };
  await writeMeta(project, LOCK, lock);
  return { metadata: await safe(git, LOCK), comparison: await compare(project, lock), message: '지정한 원본을 로컬 기준으로 등록했습니다. 프로젝트 파일은 변경하지 않았습니다.' };
}

async function compare(project, lock, source, selectedFile) {
  const current = await localFiles(project, lock);
  const incoming = source ? await sourceBundle(source, lock.mapping) : undefined;
  const decisions = await readMeta(project, DECISIONS, {});
  const changed = [];
  for (const file of [...new Set([...Object.keys(lock.base), ...Object.keys(current), ...Object.keys(incoming?.files ?? {})])].sort()) {
    const localChanged = current[file] !== lock.base[file];
    const upstreamChanged = incoming ? incoming.files[file] !== lock.base[file] : false;
    if (!localChanged && !upstreamChanged) continue;
    const decision = decisions[file];
    changed.push({ file, localChanged, upstreamChanged, kind: decision && decision.hash === digest(current[file] ?? '<deleted>') ? decision.kind : 'unclassified', reason: decision?.reason });
  }
  let detail;
  if (selectedFile) {
    if (!Object.values(lock.mapping).includes(selectedFile.split('/')[0])) throw new Error('관리하는 스킬 파일을 선택하세요.');
    await safe(project, `.agents/skills/${selectedFile}`);
    detail = { file: selectedFile, base: lock.base[selectedFile] ?? null, local: current[selectedFile] ?? null };
    if (incoming) detail.incoming = incoming.files[selectedFile] ?? null;
  }
  return { source: lock.source, incoming: incoming && { version: incoming.version, digest: incoming.digest }, changed, detail };
}

async function merge(base, local, incoming) {
  if (local === base) return { content: incoming };
  if (incoming === base || local === incoming) return { content: local };
  if (base === undefined || local === undefined || incoming === undefined) return { conflict: true };
  const temp = await fs.mkdtemp(path.join(os.tmpdir(), 'goraebap-merge-'));
  try {
    const names = ['local', 'base', 'incoming'].map(name => path.join(temp, name));
    await Promise.all(names.map((name, i) => fs.writeFile(name, [local, base, incoming][i])));
    const result = spawnSync('git', ['merge-file', '-p', ...names], { encoding: 'utf8', windowsHide: true, maxBuffer: 16 * 1024 * 1024 });
    if (result.error) throw result.error;
    if (result.status === 0) return { content: result.stdout };
    if (result.status > 0 && result.status <= 127) return { conflict: true };
    throw new Error(`git merge-file 실패: ${result.stderr}`);
  } finally {
    for (const name of ['local', 'base', 'incoming']) await fs.unlink(path.join(temp, name));
    await fs.rmdir(temp);
  }
}

async function update(project, lock, source, apply) {
  const incoming = await sourceBundle(source, lock.mapping);
  const local = await localFiles(project, lock);
  const changes = [];
  const conflicts = [];
  for (const file of new Set([...Object.keys(lock.base), ...Object.keys(local), ...Object.keys(incoming.files)])) {
    const result = await merge(lock.base[file], local[file], incoming.files[file]);
    if (result.conflict) conflicts.push(file);
    else if (result.content !== local[file]) changes.push({ file, content: result.content });
  }
  if (conflicts.length) return { applied: false, conflicts, message: '충돌 때문에 스킬과 lock을 변경하지 않았습니다. 기준·프로젝트·새 원본을 검토해 프로젝트 파일을 해결한 뒤 다시 실행하세요.' };
  if (apply) {
    // Preflight every target, including deleted files, before the first mutation.
    for (const { file } of changes) await safe(project, `.agents/skills/${file}`);
    for (const { file, content } of changes) await write(project, `.agents/skills/${file}`, content);
    lock.source = { identity: incoming.identity, version: incoming.version, digest: incoming.digest };
    lock.base = incoming.files;
    await writeMeta(project, LOCK, lock);
  }
  return { applied: apply, files: changes.map(c => c.file), incoming: { version: incoming.version, digest: incoming.digest }, next: apply ? '차이를 검토하고 프로젝트 검증 후 sync를 실행하세요.' : '--apply를 주면 적용합니다.' };
}

async function classify(project, lock, options) {
  const file = options.file;
  if (!file || !Object.values(lock.mapping).includes(file.split('/')[0])) throw new Error('--file에 스킬 이름부터의 상대 경로를 주세요.');
  if (!['project', 'upstream', 'trial'].includes(options.kind) || typeof options.reason !== 'string' || !options.reason.trim()) throw new Error('--kind project|upstream|trial 및 --reason이 필요합니다.');
  const current = await read(project, `.agents/skills/${file}`);
  if (current === lock.base[file]) throw new Error('기준과 달라진 파일만 분류할 수 있습니다.');
  const decisions = await readMeta(project, DECISIONS, {});
  decisions[file] = { kind: options.kind, reason: options.reason, hash: digest(current ?? '<deleted>') };
  await writeMeta(project, DECISIONS, decisions);
  return { file, ...decisions[file] };
}

async function propose(project, lock, options) {
  if (!slug(options.name)) throw new Error('--name에 제안 이름을 주세요.');
  const current = await localFiles(project, lock);
  const decisions = await readMeta(project, DECISIONS, {});
  const changes = [];
  for (const [file, decision] of Object.entries(decisions)) {
    if (!Object.values(lock.mapping).includes(file.split('/')[0])) throw new Error('관리 범위 밖의 제안입니다.');
    if (decision.kind !== 'upstream' || current[file] === lock.base[file] || decision.hash !== digest(current[file] ?? '<deleted>')) continue;
    const target = file.split('/')[0];
    const original = Object.keys(lock.mapping).find(key => lock.mapping[key] === target);
    changes.push({ file, upstreamFile: `${original}/${file.slice(target.length + 1)}`, reason: decision.reason, base: lock.base[file] ?? null, proposed: current[file] ?? null });
  }
  if (!changes.length) throw new Error('현재 변경 중 upstream으로 분류한 파일이 없습니다. classify를 먼저 실행하세요.');
  const relative = `goraebap-workflow/proposals/${options.name}.json`;
  const destination = await safe(await gitDirectory(project), relative);
  if (await exists(destination)) throw new Error('같은 이름의 제안이 있습니다.');
  await writeMeta(project, relative, { schemaVersion: 1, source: lock.source, mapping: lock.mapping, status: 'draft', changes });
  return { destination, files: changes.map(c => c.file), message: '로컬 Git 경로에 초안만 만들었습니다. 회사 정보와 제품 전용 내용을 검토한 뒤 공통 원본에 별도로 반영하세요.' };
}

const HELP = `goraebap-workflow (Node >=22, 병합에는 Git 필요)
node manager/scripts/workflow.mjs <명령> --project <프로젝트 경로> [옵션]

onboard   [--agents claude-code,codex] [--source <개발용 원본>] 프로젝트 판별·신규 온보딩
install   [--source <개발용 원본>] [--prefix <이름>] 기존 스킬 덮어쓰기 금지
adopt     --source <채택했던 원본> [--prefix <이름>] 로컬 관리 기준 재등록
setup-sync [--agents claude-code,grok,codex]       독립 동기화 도구·시작 훅·gitignore 준비
compare   [--source <새 원본>] [--file <스킬/파일>] 변경 목록과 선택한 파일의 세 버전
update    [--source <새 원본>] [--apply]           기본은 미리보기, 충돌 시 미적용
sync      [--check] [--agents claude-code,grok,codex] 프로젝트 전체 스킬의 로컬 사본 동기화
classify  --file <스킬/파일> --kind project|upstream|trial --reason <이유>
propose   --name <이름>                           upstream 변경의 로컬 제안

기본 source는 설치된 플러그인의 project-source이며 개발 체크아웃에서는 plugin 폴더입니다. 저장소 루트와 plugin 경로 모두 --source로 받을 수 있습니다.
--source는 개발·시험용 선택 옵션입니다. adopt의 과거 기준은 명시해야 합니다.
lock에는 로컬 절대 경로를 저장하지 않습니다.
관리 기준·분류·제안은 Git이 알려주는 로컬 .git 경로에만 보관합니다.
onboard는 AGENTS.md가 없을 때 일반 작업 지침을 만듭니다. 기존 파일은 통합할 내용을 반환합니다.
install과 나머지 명령은 AGENTS.md·앱 코드·사용자 전역 설정을 수정하지 않습니다.\n`;

export async function run(args) {
  const [command, ...rest] = args;
  if (!command || command === 'help' || command === '--help') return { help: HELP };
  const options = {};
  const allowed = { onboard: ['source', 'prefix', 'agents'], install: ['source', 'prefix', 'agents'], adopt: ['source', 'prefix'], 'setup-sync': ['agents'], compare: ['source', 'file'], update: ['source', 'apply'], sync: ['check', 'agents'], classify: ['file', 'kind', 'reason'], propose: ['name'] };
  if (!allowed[command]) throw new Error(`알 수 없는 명령: ${command}`);
  for (let i = 0; i < rest.length; i++) {
    const key = rest[i].startsWith('--') ? rest[i].slice(2) : '';
    if (!['project', ...allowed[command]].includes(key) || Object.hasOwn(options, key)) throw new Error(`잘못되거나 중복된 옵션: ${rest[i]}`);
    if (['apply', 'check'].includes(key)) options[key] = true;
    else {
      const value = rest[++i];
      if (!value || value.startsWith('--')) throw new Error(`--${key} 값이 필요합니다.`);
      options[key] = value;
    }
  }
  if (!options.project) throw new Error('--project를 명시하세요.');
  const project = await fs.realpath(path.resolve(options.project));
  const source = options.source ? await fs.realpath(path.resolve(options.source)) : await defaultSource();
  if (command === 'onboard') return onboard(project, source, options);
  if (command === 'setup-sync') return applySetup(project, await setupPlan(project, selectedAgents(options)));
  if (command === 'sync') return synchronize(project, { agents: options.agents ? selectedAgents(options) : undefined, check: Boolean(options.check) });
  if (command === 'install') return install(project, source, options);
  if (command === 'adopt') return adopt(project, source, options);
  const lock = await readMeta(project, LOCK);
  validateLock(lock);
  // Validate baseline paths before any command, including classifications/proposals.
  for (const file of Object.keys(lock.base)) await safe(project, `.agents/skills/${file}`);
  if (command === 'compare') return compare(project, lock, options.source ? source : undefined, options.file);
  if (command === 'update') return update(project, lock, source, Boolean(options.apply));
  if (command === 'classify') return classify(project, lock, options);
  return propose(project, lock, options);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = await run(process.argv.slice(2));
    process.stdout.write(result.help ?? json(result));
    if (result.conflicts?.length || result.check && !result.synchronized) process.exitCode = 1;
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
