import test from 'node:test';
import assert from 'node:assert/strict';
import { visibleCodeLinks } from '../src/features/work-item-detail/model/visible-code-links.ts';

test('a frontend PR does not hide the same named branch in the backend repository', () => {
  const links = [
    { id: 'frontend-branch', integrationId: 'frontend', kind: 'branch', externalId: 'feature/DEMO-91' },
    { id: 'backend-branch', integrationId: 'backend', kind: 'branch', externalId: 'feature/DEMO-91' },
    { id: 'frontend-pr', integrationId: 'frontend', kind: 'pull_request', externalId: '1', detail: 'feature/DEMO-91' },
  ];
  assert.deepEqual(visibleCodeLinks(links).map(link => link.id), ['backend-branch', 'frontend-pr']);
});

test('identical PR numbers and commit SHAs from different repositories remain separate', () => {
  const links = ['frontend', 'backend'].flatMap(integrationId => [
    { id: `${integrationId}-pr`, integrationId, kind: 'pull_request', externalId: '1', detail: 'feature/DEMO-91' },
    { id: `${integrationId}-commit`, integrationId, kind: 'commit', externalId: 'same-sha' },
  ]);
  assert.deepEqual(visibleCodeLinks(links), links);
});
