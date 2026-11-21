import test from 'node:test';
import assert from 'node:assert/strict';
import { statusLanes } from '../src/features/work-item-list/model/status-lanes.ts';

const columns = [
  { id: 'backlog', name: '백로그', category: 'BACKLOG', position: 0 },
  { id: 'doing-a', name: '진행 중', category: 'STARTED', position: 2 },
  { id: 'review-a', name: '검토 중', category: 'STARTED', position: 3 },
  { id: 'doing-b', name: '진행 중', category: 'STARTED', position: 2 },
  { id: 'review-b', name: '검토 중', category: 'STARTED', position: 3 },
];
const items = columns.slice(0, 4).map(column => ({ id: column.id, columnId: column.id, columnName: column.name, category: column.category }));

test('workspace keeps review separate from started and merges matching states across projects', () => {
  const lanes = statusLanes(items, columns, true);
  assert.deepEqual(lanes.map(lane => [lane.column.name, lane.workItems.map(item => item.id)]), [
    ['백로그', ['backlog']], ['진행 중', ['doing-a', 'doing-b']], ['검토 중', ['review-a']],
  ]);
});

test('default kanban excludes backlog but an explicit backlog selection can include it', () => {
  assert.deepEqual(statusLanes(items, columns, true, true).map(lane => lane.column.name), ['진행 중', '검토 중']);
  assert.equal(statusLanes(items, columns, true, false)[0].column.name, '백로그');
});

test('empty review lanes remain available and project columns keep their IDs and order', () => {
  const lanes = statusLanes([], columns, false, true);
  assert.deepEqual(lanes.map(lane => lane.column.id), ['doing-a', 'review-a', 'doing-b', 'review-b']);
  assert.ok(lanes.every(lane => lane.workItems.length === 0));
});
