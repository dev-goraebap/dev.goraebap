/** 검색 페이지의 주소(?q=검색어). 비었으면 q를 두지 않는다. 너무 긴 값은 잘라 둔다(주소에 붙여 온 값). */
const MAX = 200

export function parseSearchPage(raw: Record<string, unknown>): { q: string } {
  const q = typeof raw.q === "string" ? raw.q : typeof raw.q === "number" ? String(raw.q) : ""
  return { q: q.slice(0, MAX) }
}

export function searchPageSearch(words: string): Record<string, string> {
  const q = words.trim()
  return q ? { q } : {}
}
