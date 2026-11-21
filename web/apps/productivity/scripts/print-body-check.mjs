import assert from 'node:assert/strict';
import { printBody } from '../src/pages/print/documents/$documentId/model/print-body.ts';

const heading = (text, attrs = {}) => ({ type: 'heading', attrs: { level: 1, ...attrs }, content: [{ type: 'text', text }] });
const paragraph = (text, attrs = {}) => ({ type: 'paragraph', attrs, content: [{ type: 'text', text }] });
const source = { type: 'doc', content: [heading('7. 배치 뷰'), heading('7.1 운영 환경', { level: 2 }), paragraph('설명')] };
const before = structuredClone(source);
const result = printBody(source, '7. 배치 뷰');
assert.deepEqual(source, before, '출력 준비가 저장된 원문을 바꾸면 안 된다');
assert.equal(result.body.content[0].content[0].text, '7.1 운영 환경', '중복 문서 제목을 제거한다');
const first = printBody({ type: 'doc', content: [paragraph('첫 블록', { printBreakBefore: true })] }, '새 문서');
assert.equal(first.startsNewPage, true, '첫 블록의 새 쪽 시작은 문서 제목에도 적용한다');
assert.equal(first.body.content[0].attrs.printBreakBefore, null, '제목과 첫 블록 사이에서 다시 쪽을 나누면 안 된다');
const legacy = printBody({ type: 'doc', attrs: { printStartOnNewPage: true }, content: [heading('내용 제목')] }, '문서');
assert.equal(legacy.startsNewPage, true, '이전 문서 단위 설정을 보존한다');
assert.equal(legacy.body.content[0].attrs.level, 2, '이전 본문 H1은 출력에서 H2로 다룬다');
assert.equal(legacy.body.attrs.printStartOnNewPage, undefined);
console.log('✓ 중복 제목·첫 블록 쪽 나눔·이전 설정 호환·원문 보존');
