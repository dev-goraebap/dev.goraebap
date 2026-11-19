import assert from 'node:assert/strict';
import test from 'node:test';
import { adapterName, context } from '../hooks/adapter-context.mjs';

test('AGENTS.md의 Webapp 어댑터 줄에서 어댑터 이름을 읽는다', () => {
  assert.equal(adapterName('# 제품\n\n- Webapp 어댑터: cowork\n'), 'cowork');
  assert.equal(adapterName('<!-- webapp@dev-goraebap:start -->\n## 개발 지침\n\n- Webapp 어댑터: cowork\n<!-- webapp@dev-goraebap:end -->\n'), 'cowork');
  assert.equal(adapterName('Webapp 어댑터: `cowork`'), 'cowork');
  assert.equal(adapterName('- Webapp 예제: cowork'), 'cowork');
  assert.equal(adapterName('# 제품\n지침을 따릅니다.'), null);
  assert.equal(adapterName(null), null);
});

test('어댑터 파일이 있으면 함께 읽을 목록을 맥락으로 준다', () => {
  const output = context('cowork', ['frontend.md', 'ui-ux.md', 'notes.txt'], '/plugin/adapters');
  const text = output.hookSpecificOutput.additionalContext;
  assert.equal(output.hookSpecificOutput.hookEventName, 'SessionStart');
  assert.match(text, /어댑터 `cowork`/);
  assert.match(text, /frontend\.md/);
  assert.match(text, /ui-ux\.md/);
  assert.doesNotMatch(text, /notes\.txt/);
});

test('어댑터가 없거나 파일이 없으면 아무것도 내지 않는다', () => {
  assert.equal(context(null, ['a.md'], '/x'), null);
  assert.equal(context('cowork', [], '/x'), null);
});
