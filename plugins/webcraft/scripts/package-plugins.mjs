import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const pkg = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));
const description = '웹 플랫폼 개발 지침(프론트·디자인 시스템·백엔드·API·DB·아키텍처)과 프로젝트 연결';
const json = value => `${JSON.stringify(value, null, 2)}\n`;
/**
 * 사람이 부르거나 입구(goraebap-mode)가 링크로 읽을 때만 쓰는 영역 지침. 설명이 범용(React·Java 등)이라 자동 호출을 열어 두면
 * webcraft를 쓰지 않는 프로젝트에서도 끼어든다. 입구와 연결 도구는 설명에 조건(AGENTS.md가 밝힌 프로젝트, 이름으로
 * 한 요청)을 적고 자동 호출을 연다.
 */
export const explicitOnly = ['frontend', 'design-system', 'backend', 'api', 'database', 'architecture'];

async function put(relative, content) {
  const destination = path.join(root, 'dist', relative);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  // Windows readers may memory-map a copied skill before its metadata is set.
  // Replace the file atomically rather than truncating that mapped file.
  const next = `${destination}.next`;
  await fs.writeFile(next, content);
  await fs.rename(next, destination);
}

async function copyFiles(source, destination, extensions = ['.md', '.mjs', '.yaml']) {
  for (const entry of await fs.readdir(source, { withFileTypes: true })) {
    const next = path.join(source, entry.name);
    if (entry.isDirectory()) await copyFiles(next, `${destination}/${entry.name}`, extensions);
    else if (entry.isFile() && extensions.includes(path.extname(entry.name))) await put(`${destination}/${entry.name}`, await fs.readFile(next));
    else throw new Error(`배포 허용 목록 밖의 파일: ${next}`);
  }
}

export async function packagePlugins() {
  const dist = path.resolve(root, 'dist');
  // Never package the repository recursively: only the named public trees are inputs.
  try {
    const stat = await fs.lstat(dist);
    if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error('dist는 일반 폴더여야 합니다.');
    if (path.dirname(dist) !== path.resolve(root)) throw new Error('잘못된 dist 경로입니다.');
    await fs.rm(dist, { recursive: true });
  } catch (e) { if (e.code !== 'ENOENT') throw e; }
  for (const agent of ['claude', 'codex']) {
    const pluginPath = `${agent}/plugins/webcraft`;
    // 프로젝트는 사본 없이 AGENTS.md로 이 플러그인을 가리키고, 작업을 시작할 때 입구(goraebap-mode)를 읽는다.
    await copyFiles(path.join(root, 'skills'), `${pluginPath}/skills`, ['.md', '.yaml']);
    for (const name of explicitOnly) {
      if (agent === 'claude') {
        const original = await fs.readFile(path.join(root, 'skills', name, 'SKILL.md'), 'utf8');
        await put(`${pluginPath}/skills/${name}/SKILL.md`, original.replace(/^---(\r?\n)/, '$&disable-model-invocation: true$1'));
      } else {
        await put(`${pluginPath}/skills/${name}/agents/openai.yaml`, 'policy:\n  allow_implicit_invocation: false\n');
      }
    }
    await put(`${pluginPath}/README.md`, await fs.readFile(path.join(root, 'docs/plugin-usage.md')));
    const manifest = { name: pkg.name, version: pkg.version, description, author: { name: 'dev-goraebap' }, skills: './skills/' };
    if (agent === 'codex') {
      manifest.requires_local_executor = true;
      manifest.interface = { displayName: 'Webcraft', shortDescription: description, developerName: 'dev-goraebap' };
    }
    await put(`${pluginPath}/.${agent}-plugin/plugin.json`, json(manifest));
    await put(`${pluginPath}/package.json`, json({ name: pkg.name, version: pkg.version, private: true, type: 'module' }));
    if (agent === 'claude') {
      await put(`${agent}/.claude-plugin/marketplace.json`, json({ name: 'dev-goraebap', description, owner: { name: 'dev-goraebap' }, plugins: [{ name: pkg.name, source: './plugins/webcraft', description }] }));
    } else {
      await put(`${agent}/.agents/plugins/marketplace.json`, json({ name: 'dev-goraebap', interface: { displayName: '데브 고래밥' }, plugins: [{ name: pkg.name, source: { source: 'local', path: './plugins/webcraft' }, policy: { installation: 'AVAILABLE', authentication: 'ON_INSTALL' }, category: 'Productivity' }] }));
    }
  }
  return dist;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.stdout.write(`${await packagePlugins()}\n`);
}
