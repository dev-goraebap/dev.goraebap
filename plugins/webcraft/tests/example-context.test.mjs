import assert from 'node:assert/strict';
import test from 'node:test';
import { context, exampleName } from '../hooks/example-context.mjs';

test('AGENTS.md의 Webcraft 예제 줄에서 예제 이름을 읽는다', () => {
  assert.equal(exampleName('# 제품\n\n- Webcraft 예제: cowork\n'), 'cowork');
  assert.equal(exampleName('Webcraft 예제: `cowork`'), 'cowork');
  assert.equal(exampleName('# 제품\n지침을 따릅니다.'), null);
  assert.equal(exampleName(null), null);
});

test('예제 파일이 있으면 함께 읽을 목록을 맥락으로 준다', () => {
  const output = context('cowork', ['frontend.md', 'README.md', 'notes.txt'], '/plugin/examples');
  const text = output.hookSpecificOutput.additionalContext;
  assert.equal(output.hookSpecificOutput.hookEventName, 'SessionStart');
  assert.match(text, /예제 `cowork`/);
  assert.match(text, /frontend\.md/);
  assert.doesNotMatch(text, /notes\.txt/);
});

test('예제가 없거나 파일이 없으면 아무것도 내지 않는다', () => {
  assert.equal(context(null, ['a.md'], '/x'), null);
  assert.equal(context('cowork', [], '/x'), null);
});
