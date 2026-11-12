import { WORK_ITEM_VIEWS, type WorkItemView } from "@/entities/work-item"
import type { PageView } from "@/shared/ui/page"

/** 업무 페이지의 뷰 탭. 정의는 업무 entity의 WORK_ITEM_VIEWS(사이드바와 함께 읽는다). */
export type View = WorkItemView

export const VIEWS: PageView<View>[] = [...WORK_ITEM_VIEWS]

/** 모르는 값이면 전체 업무. */
export function parseView(raw: Record<string, unknown>): View {
  return VIEWS.find(view => view.value === raw.view)?.value ?? "all"
}

/** 뷰만 바꾼 주소의 검색 값(다른 값, 예: 열린 새 업무 표시는 그대로 둔다). */
export function withView(current: Record<string, unknown>, view: View): Record<string, unknown> {
  const { view: _old, ...rest } = current
  return view === "all" ? rest : { ...rest, view }
}
