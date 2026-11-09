import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { explicitOnly, packagePlugins } from '../scripts/package-plugins.mjs';
import { compareVersions, notice } from '../hooks/update-check.mjs';

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
  const plugin = path.join(dist, agent, 'plugins/webcraft');

  test(`${agent}: 원본의 지침을 모두 그대로 담는다`, async () => {
    const source = (await fs.readdir(path.join(root, 'skills'))).sort();
    const packaged = (await fs.readdir(path.join(plugin, 'skills'))).sort();
    assert.deepEqual(packaged, source);
    for (const name of source) {
      const original = await fs.readFile(path.join(root, 'skills', name, 'SKILL.md'), 'utf8');
      const packaged = await fs.readFile(path.join(plugin, 'skills', name, 'SKILL.md'), 'utf8');
      assert.equal(packaged.replace(/disable-model-invocation: true\r?\n/, ''), original);
    }
  });

  test(`${agent}: 영역 지침은 명시 호출 전용이고 입구·연결 도구만 스스로 불린다`, async () => {
    for (const name of await fs.readdir(path.join(plugin, 'skills'))) {
      const skill = await fs.readFile(path.join(plugin, 'skills', name, 'SKILL.md'), 'utf8');
      const policy = await fs.readFile(path.join(plugin, 'skills', name, 'agents/openai.yaml'), 'utf8').catch(() => '');
      const isExplicit = agent === 'claude' ? /^---\r?\ndisable-model-invocation: true\r?\n/.test(skill) : policy.includes('allow_implicit_invocation: false');
      assert.equal(isExplicit, explicitOnly.includes(name), name);
    }
    assert(!explicitOnly.includes('goraebap-mode') && !explicitOnly.includes('manage-workflow'));
  });

  test(`${agent}: 사본·동기화 도구와 문서 밖의 파일을 담지 않는다`, async () => {
    for (const file of await files(plugin)) {
      const isHook = agent === 'claude' && path.relative(plugin, file).startsWith(`hooks${path.sep}`);
      assert(['.md', '.json', '.yaml'].includes(path.extname(file)) || (isHook && path.extname(file) === '.mjs'), file);
      assert(!/manager|project-source|sync-skills/.test(path.relative(plugin, file)), file);
    }
  });

  test(`${agent}: 매니페스트가 판과 지침 위치를 가리킨다`, async () => {
    const manifest = JSON.parse(await fs.readFile(path.join(plugin, `.${agent}-plugin/plugin.json`), 'utf8'));
    assert.equal(manifest.version, pkg.version);
    assert.equal(manifest.skills, './skills/');
    assert.equal(manifest.name, 'webcraft');
    const skillNames = await fs.readdir(path.join(plugin, 'skills'));
    assert(skillNames.includes('goraebap-mode'), '입구 스킬 이름은 플러그인 이름과 별개로 유지합니다.');
    assert(!skillNames.includes('webcraft-mode'));
    const catalogFile = agent === 'claude' ? '.claude-plugin/marketplace.json' : '.agents/plugins/marketplace.json';
    const catalog = JSON.parse(await fs.readFile(path.join(dist, agent, catalogFile), 'utf8'));
    assert.equal(catalog.name, 'dev-goraebap');
    assert.deepEqual(catalog.plugins.map(item => item.name), ['webcraft']);
    const workspaceCatalog = JSON.parse(await fs.readFile(path.resolve(root, '../..', catalogFile), 'utf8'));
    assert.equal(workspaceCatalog.name, catalog.name);
    const source = workspaceCatalog.plugins[0].source;
    const sourcePath = typeof source === 'string' ? source : source.path;
    const workspacePlugin = path.resolve(root, '../..', sourcePath);
    assert.equal(workspacePlugin, plugin);
    assert(!(await files(plugin)).some(file => /(^|[/\\])(site|posts|samples)([/\\]|$)/.test(path.relative(plugin, file))));
  });
}

test('claude: 새 판 알림 훅은 시작할 때만 돌고 담긴 스크립트를 가리킨다', async () => {
  const plugin = path.join(dist, 'claude/plugins/webcraft');
  const config = JSON.parse(await fs.readFile(path.join(plugin, 'hooks/hooks.json'), 'utf8'));
  const [entry] = config.hooks.SessionStart;
  assert.equal(entry.matcher, 'startup');
  const script = entry.hooks[0].command.match(/\$\{CLAUDE_PLUGIN_ROOT\}\/([^"]+)/)[1];
  await fs.access(path.join(plugin, script));
  await assert.rejects(fs.access(path.join(dist, 'codex/plugins/webcraft/hooks')));
});

test('새 판 알림은 최신 판이 더 높을 때만 낸다', () => {
  assert(compareVersions('0.10.0', '0.9.9') > 0);
  assert.equal(compareVersions('0.8.0', '0.8.0-rc.1'), 0);
  assert.equal(notice('0.8.0', '0.8.0'), null);
  assert.equal(notice('0.8.1', '0.8.0'), null);
  assert.equal(notice('0.8.0', null), null);
  const output = notice('0.8.0', '0.8.1');
  assert.match(output.systemMessage, /0\.8\.1/);
  assert.equal(output.hookSpecificOutput.hookEventName, 'SessionStart');
  assert.match(output.hookSpecificOutput.additionalContext, /claude plugin update webcraft@dev-goraebap/);
});
