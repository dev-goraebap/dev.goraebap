import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const pkg = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));
const description = '명시 호출용 웹 개발 지침과 프로젝트 설치·비교·업데이트 관리';
const json = value => `${JSON.stringify(value, null, 2)}\n`;

async function put(relative, content) {
  const destination = path.join(root, 'dist', relative);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.writeFile(destination, content);
}

async function copyFiles(source, destination) {
  for (const entry of await fs.readdir(source, { withFileTypes: true })) {
    const next = path.join(source, entry.name);
    if (entry.isDirectory()) await copyFiles(next, `${destination}/${entry.name}`);
    else if (entry.isFile() && ['.md', '.mjs', '.yaml'].includes(path.extname(entry.name))) await put(`${destination}/${entry.name}`, await fs.readFile(next));
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
    await copyFiles(path.join(root, 'manager/skills'), `${pluginPath}/manager/skills`);
    await copyFiles(path.join(root, 'manager/scripts'), `${pluginPath}/manager/scripts`);
    await copyFiles(path.join(root, 'skills'), `${pluginPath}/manager/skills`);
    const skillRoot = path.join(root, 'dist', pluginPath, 'manager/skills');
    for (const name of await fs.readdir(skillRoot)) {
      const file = path.join(skillRoot, name, 'SKILL.md');
      const original = await fs.readFile(file, 'utf8');
      await fs.writeFile(file, original.replace(/^---\r?\n/, '---\ndisable-model-invocation: true\n'));
      await put(`${pluginPath}/manager/skills/${name}/agents/openai.yaml`, 'policy:\n  allow_implicit_invocation: false\n');
    }
    await put(`${pluginPath}/README.md`, await fs.readFile(path.join(root, 'docs/plugin-usage.md')));
    const manifest = { name: pkg.name, version: pkg.version, description, author: { name: 'goraebap' }, skills: './manager/skills/' };
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
