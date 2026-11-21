import test from 'node:test';
import assert from 'node:assert/strict';
import { listingForGroup } from '../src/features/work-item-list/model/board-query.ts';

test('a status lane narrows IDs while preserving every other condition and order', () => {
  const original = { category: 'STARTED', project: 'ONE,TWO', assignee: 'me', labelId: 'label', q: '오류', sort: 'UPDATED', direction: 'DESC' };
  const actual = listingForGroup(original, 'STATUS', { id: 'STARTED:검토 중', columnIds: ['review-one', 'review-two'] });
  assert.deepEqual(actual, { ...original, columnId: 'review-one,review-two' });
  assert.equal(original.columnId, undefined);
});
test('each grouping reads only its own slice and none keeps the original conditions', () => {
  const original = { project: 'ONE,TWO', assignee: 'me,none', type: 'TASK,BUG', priority: 'HIGH,LOW' };
  for (const [grouping, field, id] of [['PROJECT', 'project', 'ONE'], ['ASSIGNEE', 'assignee', 'none'], ['TYPE', 'type', 'BUG'], ['PRIORITY', 'priority', 'HIGH']]) {
    assert.deepEqual(listingForGroup(original, grouping, { id }), { ...original, [field]: id });
  }
  assert.deepEqual(listingForGroup(original, 'NONE', { id: 'all' }), original);
});
