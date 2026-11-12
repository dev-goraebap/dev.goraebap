/** 문서함의 뷰(호호코워크와 같이 ?view=저장한 뷰 id). 전체 문서는 주소에 두지 않는다. */
export const ALL_VIEW = "all"

/** 주소가 고른 뷰 id. 있는지는 문서함을 읽은 뒤 화면이 가린다. */
export function requestedView(raw: Record<string, unknown>): string {
  return typeof raw.view === "string" && raw.view ? raw.view : ALL_VIEW
}

/** 뷰만 바꾼 주소의 검색 값(새 문서 양식 표시 같은 다른 값은 그대로). */
export function withView(current: Record<string, unknown>, view: string): Record<string, unknown> {
  const { view: _old, ...rest } = current
  return view === ALL_VIEW ? rest : { ...rest, view }
}
