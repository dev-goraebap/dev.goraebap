import { describe, expect, test } from 'vitest';
import { readPostSearch, postSearchHref } from '@/entities/post/search';

describe('블로그 태그 주소', () => {
  test('단일·반복 파라미터·라우터 JSON 배열을 같은 선택으로 읽는다', () => {
    expect(readPostSearch('?tag=backend').tags).toEqual(['backend']);
    expect(readPostSearch('?tag=backend&tag=frontend').tags).toEqual(['backend', 'frontend']);
    expect(readPostSearch('?tag=%5B%22backend%22%2C%22frontend%22%5D').tags).toEqual(['backend', 'frontend']);
  });
  test('여러 태그를 저장하고 초기화해도 검색어는 보존한다', () => {
    const selected = postSearchHref('?q=설계', 'tag', ['backend', 'frontend']);
    expect(readPostSearch(selected.split('?')[1])).toEqual({ q: '설계', tags: ['backend', 'frontend'] });
    const cleared = postSearchHref(selected.split('?')[1], 'tag', []);
    expect(readPostSearch(cleared.split('?')[1])).toEqual({ q: '설계', tags: [] });
  });
});
