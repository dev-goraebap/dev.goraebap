import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { packagePlugins } from '../scripts/package-plugins.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const pkg = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));
const dist = await packagePlugins();

async function files(directory) {
  const out = [];
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) out.push(...await files(file));
    else out.push(file);
  }
  return out;
}

for (const agent of ['claude', 'codex']) {
  const plugin = path.join(dist, agent, 'plugins/goraebap-workflow');

  test(`${agent}: 원본의 지침을 모두 그대로 담는다`, async () => {
    const source = (await fs.readdir(path.join(root, 'skills'))).sort();
    const packaged = (await fs.readdir(path.join(plugin, 'skills'))).sort();
    assert.deepEqual(packaged, source);
    for (const name of source) {
      const original = await fs.readFile(path.join(root, 'skills', name, 'SKILL.md'), 'utf8');
      assert.equal(await fs.readFile(path.join(plugin, 'skills', name, 'SKILL.md'), 'utf8'), original);
    }
  });

  test(`${agent}: 지침은 에이전트가 스스로 불러 쓸 수 있다`, async () => {
    for (const file of await files(path.join(plugin, 'skills'))) {
      const content = await fs.readFile(file, 'utf8');
      assert(!content.includes('disable-model-invocation'), file);
      assert(!content.includes('allow_implicit_invocation: false'), file);
    }
  });

  test(`${agent}: 사본·동기화 도구와 문서 밖의 파일을 담지 않는다`, async () => {
    for (const file of await files(plugin)) {
      assert(['.md', '.json', '.yaml'].includes(path.extname(file)), file);
      assert(!/manager|project-source|sync-skills/.test(path.relative(plugin, file)), file);
    }
  });

  test(`${agent}: 매니페스트가 판과 지침 위치를 가리킨다`, async () => {
    const manifest = JSON.parse(await fs.readFile(path.join(plugin, `.${agent}-plugin/plugin.json`), 'utf8'));
    assert.equal(manifest.version, pkg.version);
    assert.equal(manifest.skills, './skills/');
  });
}
