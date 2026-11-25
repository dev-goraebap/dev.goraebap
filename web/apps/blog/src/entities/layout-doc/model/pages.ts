// 레이아웃 견본마다 그 레이아웃을 설명하는 지침 글(content)의 문서와 절.
// 앱 외곽은 레이아웃마다 문서 하나, 메인 영역은 「페이지 배치」 문서의 절 하나다.
export const LAYOUT_PAGES: Record<string, { slug: string; hash?: string }> = {
  "app-shell": { slug: "app-shell" },
  "sidebar-content": { slug: "sidebar-content" },
  "single-column": { slug: "single-column" },
  landing: { slug: "landing" },
  list: { slug: "page-layout", hash: "목록" },
  "list-detail": { slug: "page-layout", hash: "칸-머리" },
  "detail-properties": { slug: "page-layout", hash: "상세" },
  settings: { slug: "page-layout", hash: "설정" },
  form: { slug: "page-layout", hash: "작성-페이지" },
};

/** 레이아웃 견본 id → 지침 글 주소(스택 없는 주소는 고른 스택으로 보내진다). */
export function layoutPage(id: string) {
  const page = LAYOUT_PAGES[id];
  if (!page) return undefined;
  return `/frontend/design-system/${page.slug}${page.hash ? `#${page.hash}` : ""}`;
}
