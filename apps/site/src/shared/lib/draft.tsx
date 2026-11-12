import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react"

type Store = { drafts: Map<string, unknown>; touch: () => void; version: number }
const DraftContext = createContext<Store | null>(null)

/**
 * 작성 초안이 사는 경계. 라우터보다 위(앱 루트)에 두면 양식이 다시 마운트되어도(분기점을 넘거나, 대화상자 ↔ 페이지,
 * 다른 화면에 다녀오기) 제목 · 본문 · 속성이 남는다. 메모리에만 두므로 새로고침하면 사라진다. 새로고침까지 지키려면
 * 앱이 저장소(sessionStorage · 서버 초안)를 정한다.
 * 크게 보기 한 번만 넘기면 되는 곳은 lib/panel의 carryDraft로 충분하다. 이것은 화면을 오가도 남아야 할 초안에 쓴다.
 */
export function DraftProvider({ children }: { children: ReactNode }) {
  const [version, setVersion] = useState(0)
  const drafts = useRef(new Map<string, unknown>()).current
  const touch = useCallback(() => setVersion(version => version + 1), [])
  // version을 값에 넣어야 초안이 바뀔 때 context 값이 새로 생겨 useDraft를 쓰는 양식이 다시 그려진다.
  const store = useMemo(() => ({ drafts, touch, version }), [drafts, touch, version])
  return <DraftContext value={store}>{children}</DraftContext>
}

/**
 * 키별 초안(예: "issue-create:WEB"). 없으면 initial. clear는 저장에 성공했거나 버리기를 고른 뒤에 부른다.
 * DraftProvider 밖에서는 그 부품의 상태로만 산다(다시 마운트되면 사라진다).
 */
export function useDraft<T>(key: string, initial: T): [T, (next: T) => void, () => void] {
  const store = useContext(DraftContext)
  const [local, setLocal] = useState(initial)
  if (!store) return [local, setLocal, () => setLocal(initial)]
  const value = (store.drafts.has(key) ? store.drafts.get(key) : initial) as T
  return [
    value,
    next => { store.drafts.set(key, next); store.touch() },
    () => { store.drafts.delete(key); store.touch() },
  ]
}
