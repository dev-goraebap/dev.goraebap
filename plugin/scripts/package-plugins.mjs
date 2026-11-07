import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const pkg = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));
const description = '웹 플랫폼 개발 지침(프론트·디자인 시스템·백엔드·API·DB·아키텍처)과 프로젝트 연결';
const json = value => `${JSON.stringify(value, null, 2)}\n`;

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
    const pluginPath = `${agent}/plugins/goraebap-workflow`;
    // 지침은 에이전트가 설명을 보고 스스로 불러 쓴다. 프로젝트는 사본 없이 AGENTS.md로 이 플러그인을 가리킨다.
    await copyFiles(path.join(root, 'skills'), `${pluginPath}/skills`, ['.md', '.yaml']);
    await put(`${pluginPath}/README.md`, await fs.readFile(path.join(root, 'docs/plugin-usage.md')));
    const manifest = { name: pkg.name, version: pkg.version, description, author: { name: 'goraebap' }, skills: './skills/' };
    if (agent === 'codex') {
      manifest.requires_local_executor = true;
      manifest.interface = { displayName: 'goraebap-workflow', shortDescription: description, developerName: 'goraebap' };
    }
    await put(`${pluginPath}/.${agent}-plugin/plugin.json`, json(manifest));
    await put(`${pluginPath}/package.json`, json({ name: pkg.name, version: pkg.version, private: true, type: 'module' }));
    if (agent === 'claude') {
      await put(`${agent}/.claude-plugin/marketplace.json`, json({ name: pkg.name, description, owner: { name: 'goraebap' }, plugins: [{ name: pkg.name, source: './plugins/goraebap-workflow', description }] }));
    } else {
      await put(`${agent}/.agents/plugins/marketplace.json`, json({ name: pkg.name, interface: { displayName: 'goraebap-workflow' }, plugins: [{ name: pkg.name, source: { source: 'local', path: './plugins/goraebap-workflow' }, policy: { installation: 'AVAILABLE', authentication: 'ON_INSTALL' }, category: 'Productivity' }] }));
    }
  }
  return dist;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.stdout.write(`${await packagePlugins()}\n`);
}
