/**
 * 문서만 인쇄하는 규칙. 문서 보기(DocumentView, data-print-root)를 품지도 그 안에 있지도 않은 것은 감추고, 문서를 품은 앱 틀은
 * 높이 · 스크롤 · 여백을 풀어 모든 페이지가 이어지게 한다. 강제 페이지 넘김(break-before)은 flex 상자 안에서 듣지 않으므로 문서에서
 * 본문까지 이어지는 상자를 모두 일반 블록으로 둔다. 문서 바깥의 요소에 거는 규칙이라 클래스로 쓸 수 없어 <style>로 넣는다.
 */
export const PRINT_ISOLATION = `@media print {
  body:has([data-print-root]) :not(:has([data-print-root])):not([data-print-root]):not([data-print-root] *) { display: none !important; }
  :has([data-print-root]) { display: block !important; position: static !important; overflow: visible !important; block-size: auto !important;
    min-block-size: 0 !important; max-block-size: none !important; inline-size: auto !important; max-inline-size: none !important; margin: 0 !important;
    padding: 0 !important; border: 0 !important; box-shadow: none !important; background: none !important; zoom: 1 !important; }
  [data-print-root]:has(.ProseMirror) { display: block !important; }
  [data-print-root] :has(.ProseMirror) { display: block !important; min-block-size: 0 !important; block-size: auto !important; overflow: visible !important; }
}`
