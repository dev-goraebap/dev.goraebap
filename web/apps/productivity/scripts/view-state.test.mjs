import test from 'node:test';
import assert from 'node:assert/strict';
import { queryFromRoute, viewRoute } from '../src/features/work-item-list/model/view-route.ts';
import { workItemTree } from '../src/features/work-item-list/list-view/model/tree.ts';

const base = { state: { status: ['STARTED'] }, display: { sort: 'UPDATED', direction: 'desc', group: 'STATUS' } };
test('view links follow saved conditions while an explicit empty snapshot stays empty', () => {
  assert.deepEqual(queryFromRoute(new URLSearchParams('view=board'), base), base);
  const cleared = { state: {}, display: base.display };
  assert.deepEqual(queryFromRoute(new URLSearchParams(viewRoute('', 'board', cleared)), base), cleared);
});
test('filters and display round trip, and changing view removes the previous snapshot', () => {
  const query = { state: { priority: ['URGENT', 'HIGH'], assignee: ['me'] }, display: { sort: 'CREATED', direction: 'asc', group: 'NONE' } };
  const url = viewRoute('?unrelated=keep', 'one', query);
  assert.deepEqual(queryFromRoute(new URLSearchParams(url), base), query);
  const next = new URLSearchParams(viewRoute(url, 'two'));
  assert.equal(next.get('view'), 'two');
  assert.equal(next.get('unrelated'), 'keep');
  assert.equal(next.has('custom'), false);
});
test('invalid route values cannot add unsupported display or malformed filter values', () => {
  const result = queryFromRoute(new URLSearchParams('custom=1&sort=bad&group=bad&direction=bad&filter.status=%3Cbad%3E'), base);
  assert.deepEqual(result, { state: {}, display: base.display });
});
test('children follow their parent even when the query sorted a child first', () => {
  const child = { id: 'child', parentId: 'parent' }, parent = { id: 'parent' }, other = { id: 'other' };
  assert.deepEqual(workItemTree([child, other, parent], new Set()).map(({ item, depth }) => [item.id, depth]), [['other', 0], ['parent', 0], ['child', 1]]);
  assert.deepEqual(workItemTree([child, other, parent], new Set(['parent'])).map(({ item }) => item.id), ['other', 'parent']);
});
test('a parent outside the filter or page never hides its matching child', () => {
  assert.deepEqual(workItemTree([{ id: 'child', parentId: 'missing' }], new Set()).map(({ item }) => item.id), ['child']);
});
test('malformed cyclic relationships still render each work item once', () => {
  assert.deepEqual(workItemTree([{ id: 'a', parentId: 'b' }, { id: 'b', parentId: 'a' }], new Set()).map(({ item }) => item.id), ['a', 'b']);
});
