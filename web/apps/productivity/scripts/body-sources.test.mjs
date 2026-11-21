import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareBodyFiles } from '../src/shared/ui/rich-body/body-sources.ts';

test('an image-only draft saves a stable reference without mutating its preview', () => {
  const shown = { type: 'doc', content: [{ type: 'media', attrs: { src: 'blob:image', name: 'image.png' } }] };
  const saved = prepareBodyFiles(shown, new Map([['blob:image', 'attachment:one']]));
  assert.equal(saved.body.content[0].attrs.src, 'attachment:one');
  assert.deepEqual(saved.uploadIds, ['one']);
  assert.equal(shown.content[0].attrs.src, 'blob:image');
});

test('removed uploads and reference-like text are not bound to the owner', () => {
  const shown = { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'attachment:removed' }] }] };
  assert.deepEqual(prepareBodyFiles(shown, new Map([['blob:removed', 'attachment:removed']])).uploadIds, []);
});

test('nested images are bound once and existing or external media stay unchanged', () => {
  const shown = { type: 'doc', content: [{ type: 'blockquote', content: [
    { type: 'media', attrs: { src: 'blob:new' } }, { type: 'media', attrs: { src: 'blob:new' } },
    { type: 'media', attrs: { src: 'attachment:existing' } }, { type: 'media', attrs: { src: 'https://example.test/image.png' } },
  ] }] };
  const saved = prepareBodyFiles(shown, new Map([['blob:new', 'attachment:new']]));
  assert.deepEqual(saved.uploadIds, ['new']);
  assert.equal(saved.body.content[0].content[2].attrs.src, 'attachment:existing');
  assert.equal(saved.body.content[0].content[3].attrs.src, 'https://example.test/image.png');
});

test('retry after an acknowledged owner binding does not rebind a consumed upload', () => {
  const shown = { type: 'doc', content: [{ type: 'media', attrs: { src: 'blob:one' } }] };
  const saved = prepareBodyFiles(shown, new Map([['blob:one', 'attachment:one']]), { one: '/files/one' });
  assert.equal(saved.body.content[0].attrs.src, 'attachment:one');
  assert.deepEqual(saved.uploadIds, []);
});
