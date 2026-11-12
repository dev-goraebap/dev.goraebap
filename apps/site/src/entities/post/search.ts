/** 라우터가 정규화한 JSON 배열과 이전 반복 파라미터 주소를 함께 읽는다. */
export function readPostSearch(search: string) {
  const query = new URLSearchParams(search);
  const tags = query.getAll('tag').flatMap(value => {
    try {
      const parsed: unknown = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.filter((item): item is string => typeof item === 'string');
    } catch { /* 단일 태그는 일반 문자열이다. */ }
    return value ? [value] : [];
  });
  return { q: query.get('q') ?? '', tags: [...new Set(tags)] };
}

export function postSearchHref(search: string, key: string, values: string[]) {
  const query = new URLSearchParams(search);
  query.delete(key);
  if (values.length) query.set(key, values.length > 1 ? JSON.stringify(values) : values[0]);
  return `/blog/${query.size ? `?${query}` : ''}`;
}
